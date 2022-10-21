const Pokemon = require("../models/Pokemon")

//Store local chages
proxyServerDatabase = []

//This retrieves a list of pokemon based on the query parameters and then looks to the proxy server for changes
const getSomePokemon = async (req, res) => {
    const {count, after} = req.query
    pokemonToReturn = []
    countIndex = 0
    let allPokemon = await Pokemon.find({}).sort({id: 1})
    for (let i = 0; i < allPokemon.length; i++){
        if (allPokemon[i].id > after){
            pokemonToReturn.push(allPokemon[i])
            countIndex++
            if (countIndex >= count) {
                console.log("FOUND ALL IN COUNT")
                return res.status(200).send(pokemonToReturn)
                break;
            }
        }
    }
    return res.status(200).send(pokemonToReturn)

}

const getAPokemon = async (req, res) => {
    const { id } = req.params
    const pokemon = await Pokemon.find({id : id})
    if(!pokemon.length){
        return res.status(405).json({error: "No such Pokemon"})
    }

    pokemon = mergePokemonLists(pokemon)

    res.status(200).json(pokemon)
}

//Get all pokemon  - This will now filter all results through a local proxy database
const getAllPokemon = async (req, res) => {

    let pokemon = await Pokemon.find({}).sort({id: -1});
    pokemon = mergePokemonLists(pokemon) // Merge changes with local proxy DB

    res.status(200).json(pokemon)
}

// ! ! ! DONE ! ! ! 
//This stays the same, it's perfect
const getPokemonImage = async (req, res) => {
    const {id} = req.params
    paddedId = lpad(id, 3)
    if(id > 0 && id <= 809){
        imageURL = "https://raw.githubusercontent.com/fanzeyi/pokemon.json/master/images/" + paddedId + ".png"
    } else {
        return res.json({msg : "ID Is out of range of existing pokemon :("})
    }
    
    res.send(imageURL)
}


//This method now gets a single pokemon, patches it, then adds it to the changes in the local proxy DB
const patchAPokemon = async (req, res) => {
    const {id, name, type, base} = req.params
    pokemonDoc = await Pokemon.find({id : id})

    if (!pokemonDoc.length){
        return res.status(404).json({msg: "Pokemon Not Found for update"})
    }

    const pokemonToUpdate = await Pokemon.findOneAndUpdate({id: id}, {
        ...req.body
    })

    res.status(200).json(pokemonToUpdate)
}

//THis method now upserts a single pokemon, but any changes are stored in the local proxy database
const upsertAPokemon = async (req, res) => {
    try{

        const {id, name, type, base} = req.params
        //Now I just grab the individual document
        pokemonDoc = await Pokemon.find({id : id})
        //Update the document
        updatePokemonDocument(id, name, type, base, pokemonDoc)
        //Upsert the document
        proxyServerDatabase[id] = pokemonDoc


        const pokemonToUpdate = await Pokemon.findOneAndUpdate({id: id}, {
            ...req.body
        }, {upsert: true})

        res.status(200).json(pokemonToUpdate)
    } catch(error){
        res.status(400).json({error: error.message})
    }
    
}

const updatePokemonDocument = (id, name, type, base, pokemon) => {
    pokemon.id = id
    pokemon.name = name
    pokemon.type = type
    pokemon.base = base
}

//I need to find a single pokemon, then delete it from the local proxy database
const deleteAPokemon = async (req, res) => {
    const { id } = req.params
    const pokemon = await Pokemon.find({id : id})
    if(!pokemon.length){
        return res.status(404).json({error: "No such Pokemon"})
    }

    await Pokemon.findOneAndDelete({id : id}).then(() =>{
        res.status(200).send("Pokemon " + id + " successfully deleted.")
    })
    
}

function lpad(value, padding) {
    var zeroes = new Array(padding+1).join("0");
    return (zeroes + value).slice(-padding);
}

// New Pokemon are added to the local proxy database
const createPokemon = async (req, res) => {
    const {id, name, type, base} = req.body
    existingPokemon = await Pokemon.find({id: id})
    if(!existingPokemon.length){
        try{
            const pokemon = await Pokemon.create({id, name, type, base})
            res.status(200).json(pokemon)
        } catch(error){
            res.status(400).json({error: error.message})
        }
    } else {
        res.status(400).json(existingPokemon)
    }
    
}

const mergePokemonLists = (pokemonList) => {
    for (let i = 0; i < pokemonList.length; i++){
        if (proxyServerDatabase[pokemonList[i].id]){
            pokemonList[i] = proxyServerDatabase[pokemonList[i].id]
        }
    }
    return pokemonList
}

updateProxyDatabase= (pokemon) => {
    proxyServerDatabase[pokemon] = pokemon
}


/*
{
        "name": {
            "english": "Ivysaur",
            "japanese": "フシギソウ",
            "chinese": "妙蛙草",
            "french": "Herbizarre"
        },
        "base": {
            "HP": 60,
            "Attack": 62,
            "Defense": 63,
            "Sp. Attack": 80,
            "Sp. Defense": 80,
            "Speed": 60
        },
        "_id": "63437b48f4ee2c83b9a14c4c",
        "id": 2,
        "type": [
            "Grass",
            "Poison"
        ]
    },
*/

module.exports = {
    createPokemon,
    getAllPokemon,
    getAPokemon,
    getPokemonImage,
    patchAPokemon,
    deleteAPokemon,
    upsertAPokemon,
    getSomePokemon,
}