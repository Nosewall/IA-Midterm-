require('dotenv').config()
const express = require('express')
const Pokemon = require("./models/Pokemon")
const app = express()
const mongoose = require('mongoose')
const { Schema } = mongoose;



const { 
    createPokemon,
    getAllPokemon,
    getAPokemon,
    getPokemonImage,
    patchAPokemon,
    deleteAPokemon,
    upsertAPokemon,
    getSomePokemon,
    pokemonsAdvancedFiltering

} = require('./controllers/pokemonController')

app.use(express.json())

const database = module.exports = () => {
    try {
        mongoose.connect(process.env.MONG_URI).then(() =>{
            app.listen(process.env.PORT, () => {
                console.log("Connected to Poke-base and looking for Poke-pals on port " + process.env.PORT)
            })
        });
    } catch (error) {
        console.log(error)
        console.log("Failed to connect")
    }
};
database();




app.get('/api/v1/allPokemon', getAllPokemon)

app.get('/api/v1/pokemon/:id', getAPokemon)

app.post('/api/v1/pokemon', createPokemon)

app.get('/api/v1/pokemonImage/:id', getPokemonImage)

app.patch('/api/v1/pokemon/:id', patchAPokemon)

app.put('/api/v1/pokemon/:id', upsertAPokemon)

app.delete('/api/v1/pokemon/:id', deleteAPokemon)

app.get('/api/v1/pokemons', getSomePokemon)



// app.get('/api/v1/pokemons?count=2&after=10')     // - get all the pokemons after the 10th. List only Two.
// app.post('/api/v1/pokemon')                      // - create a new pokemon
// app.get('/api/v1/pokemon/:id')                   // - get a pokemon
// app.get('/api/v1/pokemonImage/:id')              // - get a pokemon Image URL
// app.put('/api/v1/pokemon/:id')                   // - upsert a whole pokemon document
// app.patch('/api/v1/pokemon/:id')                 // - patch a pokemon document or a portion of the pokemon document
// app.delete('/api/v1/pokemon/:id')                // - delete a pokemon

//Steps for proxy server
//Decide which routes are pulling remotely and which are just storing changes locally
//Create a proxy server that will pull from the remote server and store locally
//Create a local server that will store the data locally