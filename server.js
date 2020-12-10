import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'

import albumData from './data/albums.json';
import error from './data/error.json'
//https://karolin-top-albums.herokuapp.com/

//   PORT=9000 npm start
const port = process.env.PORT || 4700
const app = express()
const myEndpoints = require('express-list-endpoints');

// Add middlewares to enable cors and json body parsing
app.use(cors())
app.use(bodyParser.json())

// Start defining your routes here
app.get('/', (req, res) => {
  if (!res) {
    res
      .status(404)
      .send({ error: 'Sorry, seems like there is an issue, try again later!' });
  } 
  res.send(myEndpoints(app));
})

//Get all the albums, with queries to filter results. 
//COLLECTION
app.get('/api/albums',(req,res) => {
  let albums = albumData;

  const filterYear = req.query.year;
  const filterYearFrom = req.query.yearFrom;
  const filterYearTo = req.query.yearTo;
  const filterArtist = req.query.artist;
  const filterGenre = req.query.genre;
  const page = req.query.page || 0;

  if(filterYear)
  {
    albums = albums.filter((item) => item.Year === +filterYear);
  }

  //Not filterYear, you can't sort on both range and exact.
  if((filterYearFrom || filterYearTo) && !filterYear){
    //Filter on both from and to
    if(filterYearFrom && filterYearTo){
      albums = albums.filter((item) => item.Year >= +filterYearFrom && item.Year <= +filterYearTo);
    }
    //Only fromyear
    if(filterYearFrom && !filterYearTo){
      albums = albums.filter((item) => item.Year >= +filterYearFrom);
    }
    //Only toyear
    if(filterYearTo && !filterYearFrom){
      albums = albums.filter((item) => item.Year <= +filterYearTo);
    }
  }

  //Using includes, because there can be collabs between artists.
  if(filterArtist){
    console.log({filterArtist});
    albums = albums.filter((item) => item.Artist.toUpperCase().includes(filterArtist.toUpperCase()));
  }

  //One album can have multple genres, using include. 
  if(filterGenre){
    albums = albums.filter((item) => item.Genre.toUpperCase().includes(filterGenre.toUpperCase()));
  }

  //PAGINATION. Limit 50 per request. 
  //Allow the user to ask for next page by adding parameter. If no parameter is provided, default page is 1. 
  console.log({page});
  const albums_paged = albums.slice(page > 1 ? (50*(+page)) : 0, (50*(+page)+(+page === 1 ? 0 :50)));

  //Return an object with information 
  const returnObj = {
    totalAlbums: albumData.length,
    albumsReturned: albums_paged.length,
    results: albums_paged
  };

  //No results to show
  if(albums_paged.length < 1){
    res.status(404).send({
      error: 'Sorry, no albums found, please try a different query.'
    });
  }
  else res.json(returnObj);
})

//get the top 10 albums
app.get('/api/albums/top10',(req,res) => {
  const albums = albumData.slice(0,10);
  if(albums.length < 1){
    res.status(404).send({
      error: 'Sorry, not found, please try later.'
    })
  }
  res.json(albums);
})

//SINGLE ITEM
//Get album based on placement on list using params
app.get('/api/albums/placement/:placement',(req,res) => {
  const placement = req.params.placement;
  console.log({placement});
  const album = albumData.find((item) => item.Number === +placement);
  console.log("album",album);
  album ? res.json(album) : res.status(404).send({ error: `No album with placement: ${placement} found.` });
 // res.json(album);
})

//Get album based on title using params
app.get('/api/albums/title/:title',(req,res) => {
  const title = req.params.title.replaceAll('+',' ');
  console.log({title});
  const album = albumData.find((item) => item.Album.toString().toUpperCase().includes(title.toUpperCase()));
  console.log("album",album);
  album ? res.json(album) : res.status(404).send({ error: `No album with title: ${title} found.` });
})


// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})
