const Pokemon = require("../models/Pokemon")

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

    res.status(200).json(pokemon)
}

const getAllPokemon = async (req, res) => {
    const pokemon = await Pokemon.find({}).sort({id: -1});

    res.status(200).json(pokemon)
}

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

const upsertAPokemon = async (req, res) => {
    const {id, name, type, base} = req.params
    pokemonDoc = await Pokemon.find({id : id})

    const pokemonToUpdate = await Pokemon.findOneAndUpdate({id: id}, {
        ...req.body
    }, {upsert: true})

    res.status(200).json(pokemonToUpdate)
}


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

const pokemonsAdvancedFiltering = async (req, res) => {

    let {id,  page, hitsPerPage, "base.hp": baseHP, "base.Attack": baseAttack,
        "base.Defense":baseDefence, "base.SP Attack":baseSpAttack, "base.Sp. Defence":baseSpDefence, 
        "base.Speed":speed, type, "name.english":english, "name.french":french, "name.japanese":japanese, "name.chinese":chinese} = req.query;
    let query = {}

    if(id){query.id = id}
    if(type){query.type = type}
    if(english){query.name.english = english}
    if(french){query.name.french = french}
    if(baseHP){query.base.HP = baseHP}
    if(baseAttack){query.base.Attack = baseAttack}
    if(baseDefence){query.base.Defense = baseDefence}
    if(baseSpAttack){query.base["Sp. Attack"] = baseSpAttack}
    if(baseSpDefence){query.base["Sp. Defense"] = baseSpDefence}
    if(speed){query.base.Speed = speed}
    if(japanese){query.name.japanese = japanese}
    if(chinese){query.name.chinese = chinese}

    if (!hitsPerPage){
        hitsPerPage = 5;
    }
    if (!page){
        page = 1;
    }
    try{
        let pokelist = await Pokemon.find({query}).sort({id: 1}).limit(hitsPerPage * page)
        console.log("None Params at all")
        return res.send(pokelist)
    } catch(error){
        res.status(400).json({error: error.message})
    }
   
    
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
    pokemonsAdvancedFiltering
}