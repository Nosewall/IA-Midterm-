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

async function parseSortArgs(args) {
    let arg_parsed = {}
    args.split(',').forEach(arg => {
      arg[0]==='-' ? arg_parsed[arg.substring(1)]=-1 : arg_parsed[arg]=1;
    })
    return arg_parsed;
  }

async function parseCompArgs(args) {
    let arg_parsed = {}
    arg_parsed['$and'] = []
    let re = /(<=|>=|=|>|<){1}/g;
    args.split(',').forEach(arg => {
      var tr_arg = arg.trim()
      var regexRes = re.exec(tr_arg)
      var field = "base." + tr_arg.substring(0,regexRes.index)
      var op = regexRes[0]
      var val = parseInt(tr_arg.substring(re.lastIndex))
      var opMDB = {}
      var currentField = {}
      switch (op) {
        case '<=':
          opMDB['$lte'] = val;
          break;
        case '>=':
          opMDB['$gte'] = val;
          break;
        case '=':
          opMDB['$eq'] = val;
          break;
        case '>':
          opMDB['$gt'] = val;
          break;
        case '<':
          opMDB['$lt'] = val;
          break;
        default:
          return;
      }
      currentField[field] = opMDB;
      console.log(currentField)
      arg_parsed['$and'].push( currentField );
    })
    console.log(arg_parsed)
    return (arg_parsed['$and'].length!=0) ? arg_parsed : {}
  }

  app.get('/pokemonsAdvancedFiltering', async (req, res) => {
    try {
      comparison_args = (req.query.comparisonOperators!=null) ? await parseCompArgs(req.query.comparisonOperators) : { };
      sort_args = (req.query.sort!=null) ? await parseSortArgs(req.query.sort) : { "id": "asc" };
      const pokemon = await pokemonModel.find( comparison_args ).sort( sort_args).skip(req.query.after).limit(req.query.count)
      return res.json(pokemon)
    } catch (error) {
      return res.json( { msg: error.body } )
    }
  })

  const deconstructQueryParams = (req) => {
    let query = {}
    if (req.query.name) {
        query.name = req.query.name
    }
    if (req.query.type) {
        query.type = req.query.type
    }
    if (req.query.base) {
        query.base = req.query.base
    }
    return query

    const deconstructBaseQueryParams = (req) => {
        let query = {}
        if (req.query.hp) {
            query.hp = req.query.hp
        }
        if (req.query.attack) {
            query.attack = req.query.attack
        }
        if (req.query.defense) {
            query.defense = req.query.defense
        }
        if (req.query.spattack) {
            query.spattack = req.query.spattack
        }
        if (req.query.spdefense) {
            query.spdefense = req.query.spdefense
        }
        if (req.query.speed) {
            query.speed = req.query.speed
        }
        return query
    }

}




app.get('/api/v1/allPokemon', getAllPokemon)

app.get('/api/v1/pokemon/:id', getAPokemon)

app.post('/api/v1/pokemon', createPokemon)

app.get('/api/v1/pokemonImage/:id', getPokemonImage)

app.patch('/api/v1/pokemon/:id', patchAPokemon)

app.put('/api/v1/pokemon/:id', upsertAPokemon)

app.delete('/api/v1/pokemon/:id', deleteAPokemon)

app.get('/api/v1/pokemons', getSomePokemon)

app.get('/api/v1/pokemonAdvanced', pokemonsAdvancedFiltering)



// app.get('/api/v1/pokemons?count=2&after=10')     // - get all the pokemons after the 10th. List only Two.
// app.post('/api/v1/pokemon')                      // - create a new pokemon
// app.get('/api/v1/pokemon/:id')                   // - get a pokemon
// app.get('/api/v1/pokemonImage/:id')              // - get a pokemon Image URL
// app.put('/api/v1/pokemon/:id')                   // - upsert a whole pokemon document
// app.patch('/api/v1/pokemon/:id')                 // - patch a pokemon document or a portion of the pokemon document
// app.delete('/api/v1/pokemon/:id')                // - delete a pokemon