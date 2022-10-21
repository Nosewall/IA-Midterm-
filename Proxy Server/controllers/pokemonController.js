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

//!! DONE !!
//This method now gets a single pokemon, and checks for any changes on the proxy, then returns the changed document
const getAPokemon = async (req, res) => {
    const { id } = req.params
    let pokemon = await Pokemon.find({id : id})
    if(!pokemon.length){
        return res.status(405).json({error: "No such Pokemon"})
    }

    pokemon = mergePokemonLists(pokemon)
    logProxyDatabase()
    res.status(200).json(pokemon)
}

//This is for testing to ensure that data is being used properly
const logProxyDatabase = () => {
    console.log("Proxy Database:")
    console.log(proxyServerDatabase)
}

//!! DONE !!
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

// !! DONE !!
//This method now gets a single pokemon, patches it, then adds it to the changes in the local proxy DB
const patchAPokemon = async (req, res) => {
    const {id, name, type, base} = req.params
    pokemonDoc = await Pokemon.find({id : id})

    if (!pokemonDoc.length){
        pokemonDoc = findPokemonFromProxy(id)
        if (pokemonDoc == null){
            return res.status(404).json({error: "Pokemon not found in local proxy database or in remote DB"})
        }
    }
    //Update the document if found on local or remote, then save to local (NOT remote)
    updatePokemonDocument(id, name, type, base, pokemonDoc)
    proxyServerDatabase[id] = pokemonDoc
    res.status(200).json(pokemonDoc)
}

//Helper function to find a pokemon in the local proxy database
const findPokemonFromProxy = (id) => {
    for (let i = 0; i < proxyServerDatabase.length; i++){
        if (proxyServerDatabase[i].id == id){
            return proxyServerDatabase[i]
        }
    }
    return null
}

//!! DONE !!
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
        logProxyDatabase()  
        res.status(200).json(pokemonDoc)
    } catch(error){
        res.status(400).json({error: error.message})
    }
    
}

//Helper function to update a pokemon document
const updatePokemonDocument = (id, name, type, base, pokemon) => {
    pokemon.id = id
    pokemon.name = name
    pokemon.type = type
    pokemon.base = base
}

// !! DONE !! 
//I need to find a single pokemon, then delete it from the local proxy database
const deleteAPokemon = async (req, res) => {
    const { id } = req.params
    const pokemon = await Pokemon.find({id : id})
    if(!pokemon.length){
        pokemonDoc = findPokemonFromProxy(id)
        if (pokemonDoc == null){
            return res.status(404).json({error: "Pokemon not found in local proxy database or in remote DB for deletion"})
        }
    }
    proxyServerDatabase[id] = null

    await Pokemon.findOneAndDelete({id : id}).then(() =>{
        res.status(200).send("Pokemon " + id + " successfully deleted.")
    })
    
}

//Helper function to pad a number with leading zeros
function lpad(value, padding) {
    var zeroes = new Array(padding+1).join("0");
    return (zeroes + value).slice(-padding);
}

// New Pokemon are added to the local proxy database
const createPokemon = async (req, res) => {
    const {id, name, type, base} = req.body
    existingPokemon = await Pokemon.find({id: id})
    if(!existingPokemon.length){
        pokemonDoc = findPokemonFromProxy(id)
        if (pokemonDoc == null){
            try{
                proxyServerDatabase[id] = req.body
                res.status(200).json(pokemon)
            } catch(error){
                res.status(400).json({error: error.message})
            }
        }
        
    } else {
        res.status(400).json(existingPokemon).message(
            "Pokemon already exists in the database"
        )
    }
    
}

//Helper method to merge the local proxy database with the list of pokemon documents retrieved from remote DB
const mergePokemonLists = (pokemonList) => {
    for (let i = 0; i < pokemonList.length; i++){
        if (proxyServerDatabase[pokemonList[i].id]){
            pokemonList[i] = proxyServerDatabase[pokemonList[i].id]
        }
    }
    return pokemonList
}

//Helper function to update the proxy database
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