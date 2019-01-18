'use strict';

const bmp = require('bmp-js');
// const writer = new (require('buffer-writer')());
// likely need just 'Buffer' to replace this (Buffer.from, already built into JavaScript, pass in a str)
//bmpData={data:Buffer,width:Number,height:Height}

const fs = require('fs');

const terrainColors = [0xffff0000, 0xff888888, 0xff00ff88, 0xff00ff00];

// -------------------------- THIS LOGIC MAKES THE MAP --------------------- and holds all our maps.
const atlas = [];

// this array is to keep track of the types of terrain represented. In the mapData 2d array, terrain type will be referenced by array index in this array. unfilled map coordinates will be represented with -1.
const terrainTypes = [];

//constructor function for map objects
const mapObj = function(size){
  this.mapData = newMap(size);
  this.blanks = size * size;
  this.children = [];
  this.index = atlas.length;
  atlas.push(this);
};

//constructor function for terrain types
const terrain = function(name, bias, curve){
  this.name = name;
  this.bias = bias;
  this.curve = curve;
  terrainTypes.push(this);
};

//initialize default terrains
new terrain('water', -1);
new terrain('mountain', -1);
new terrain('plains', 1);
new terrain('forest', 1);

// initializes a blank mapData.
const newMap = function(x,y){
  let width = x;
  let height;
  y ? height = y : height = x;
  let arr = [];
  for(let i = 0; i < width; i++){
    arr.push([]);
    for(let j = 0; j < height; j++){
      arr[i].push(-1);
    }
  }
  return arr;
};

// given a mapObj, populates its mapData with terrain. "cutoffs" is an array governing the probabilities of each area "picking" a new member; default is each area gets even probability
const terraform = function(map, cutoffs){
  let seed = 1
  let seeds = spore(map.mapData, [seed,seed,seed,seed]);
  //this array will contain the candidate pool for area growth. when a coordinate point is populated, it needs to be removed from all candidate pools. For now we default to one of each terrain type. We can mess around with this later.
  if(!cutoffs)cutoffs = [.25,.5,.75,1];
  //likewise, we can mess around with this later.

  while(map.blanks){
    let type;
    do{
      type =  germinate(cutoffs);
    } while(!seeds[type].length)

    let sprouted = sprout(map.mapData, seeds[type], type);
    map.blanks--;

    for(let i = 0; i < seeds.length; i++){
      seeds[i] = seeds[i].filter((coord) => !(coord[0] === sprouted[0] && coord[1] === sprouted[1]));
    }
  }

};

//choses a candidate pool for growth
const germinate = function(cutoffs){
  let randomNum = Math.random();
  let i = 0;
  while(randomNum >= cutoffs[i]){
    i++;
  }
  return i;
};


// given a mapData and an array (and optionally an array of existing seeds), places a number of terrain seeds of each type of terrain on the map, and returns a 2d array of their coordinates. for example, an imput of (map, [1, 2, 0, 2]) will return one plains seed, two mountains seeds, no forest seeds, and two water seeds. These seeds are not yet populated on the actual map data. (This is actually a 3d array, but the last dimension is only two deep because the coordinates are themselves 2d.)
const spore = function(map, arr, seeds){
  if (!seeds) seeds = [];
  for(let i = 0; i < arr.length; i++){
    seeds.push([]);
    let j = 0;
    while(j < arr[i]){
      let seed = plant(map);

      //check if we already have this coordinate occupied by another seed
      let badSeed = false;
      for(let k = 0; k < seeds.length; k++){
        if(dupCoord(seeds[k], seed))badSeed = true;
      }
      if(!badSeed){
        seeds[i].push(seed);
        j++;
      }
    }
    // sprout(map, seeds[i], i);
  }
  return seeds;

};


//picks a random unpopulated coordinate pair. assumes the map still has blank points. curve is an optional variable that biases to the edges of the map if negative, the center if positive, and neither if 0.
const plant = function(map, curve){
  if(!curve)curve=0;
  let x;
  let y;
  do{
    x = biasedRandom(map.length, curve);
    y = biasedRandom(map.length, curve);
  }while(map[x][y]+1)

  return [x,y];
}

// chooses a coordinate point from the candidate pool, populates it on the map, and expands the candidate pool by radius for area growth. returns the coordinates of the selected coordinate point.
const sprout = function(map, pool, type){

  //some chance of planting a new seed at a random point
  if(Math.random() < .01){
    pool.push(plant(map, terrainTypes[type].curve));
  }


  let bud = pool[biasedRandom(pool.length, terrainTypes[type].bias)];
  map[bud[0]][bud[1]] = type;

  //expand pool

  //expands in square form
  for(let i = bud[0]-1; i <= bud[0]+1; i++){
    if(i > -1 && i < map.length){
      for(let j = bud[1]-1; j <= bud[1]+1; j++){
        if(j > -1 && j < map[i].length){
          if(map[i][j] ===  -1  && !dupCoord(pool, [i,j])){
            pool.push([i,j]);
          }
        }
      }
    }
  }

  // //expands in cross form
  // if(validPool(map, pool, bud[0]-1, bud[1])) pool.push([bud[0]-1,bud[1]]);
  // if(validPool(map, pool, bud[0]+1, bud[1])) pool.push([bud[0]+1,bud[1]]);
  // if(validPool(map, pool, bud[0], bud[1]-1)) pool.push([bud[0],bud[1]-1]);
  // if(validPool(map, pool, bud[0], bud[1]+1)) pool.push([bud[0],bud[1]+1]);

  return bud;

};

//checks if a coordinate can be pushed into the pool
const validPool = function(map, pool, x, y){
  if(x < 0) return false;
  if(y < 0) return false;
  if(x >= map.length) return false;
  if(y >= map.length) return false;
  if(dupCoord(pool,x,y))return false;
  if(map[x][y]+1) return false;
  return true;
}

// returns a whole number from 0 to specified range. if bias = -1, bias towards larger numbers; if bias = 1, bias to smaller numbers.
// in terms of area growth, this means that bias = 1 will be more likely to return recently pushed coordinates, which means the area will grow in a linear fashion, as in rivers or mountain ranges; bias -1 will prefer earlier coordinates, growing the area in a more blobular fashion, such as lakes.
const biasedRandom = function(range, bias){
  let ranNum = Math.random();
  if(bias){
    if(bias === 1) ranNum = Math.pow(ranNum, 3);
    else if(bias === -1) ranNum = 1 - Math.pow(ranNum, 2);
  }
  // switch(bias){
  //     case -2:
  //         if(ranNum < 0.5) ranNum = Math.pow(2 * ranNum, 2);
  //         else ranNum = Math.pow(2 * (1-ranNum), 2);
  //         break;
  //     case -1:
  //         ranNum = 1 - Math.pow(ranNum, 2);
  //         break;
  //     case 1:
  //         ranNum = Math.pow(ranNum, 3);
  //         break;
  //     case 2:
  //         if(ranNum < 0.5) ranNum = 1 - Math.pow(2 * ranNum, 2);
  //         else ranNum = 1 - Math.pow(2 * (1-ranNum), 2);
  //         break;
  // }

  let num = Math.round(ranNum * (range-1))
  return num;
};

//checks if a mapData has unpoplated points
const hasBlanks = function(map){
  return map.blanks;
};

//takes in an array of coordinates and checks if it contains the specified coordinate
const dupCoord = function(arr, coord){
  for(let i = 0; i < arr.length; i++){
    if(coord[0] === arr[i][0] && coord[1] === arr[i][1]) return true;
  }
  return false;
};

//dummy board renderer. copied from mae's 201 project.
// const renderBoard = function (map) {
//   //render the board on the page
//   let boardHolder = document.getElementById('board');
  
//   while(boardHolder.firstChild){
//     boardHolder.removeChild(boardHolder.firstChild);
//   }
  
//   //row iterates through table rows.
//   for (let row = 0; row < map.length; row++) {
//     let trEl = document.createElement('tr');
//     boardHolder.appendChild(trEl);
  
//     //col iterates through elements/columns.
//     for (let col = 0; col < map[row].length; col++) {
//       let tdEl = document.createElement('td');
//       if(map[row][col]===-1){
//         tdEl.className = 'blank'
//       }else {
//         tdEl.className = terrainTypes[map[row][col]].name;
//       }
//       //we assign the content of the board as a class name so that its appearance can be manipulated in CSS
//       trEl.appendChild(tdEl);
  
//     }
//   }
// };


// const mappy = newMap(30);
// var seeds = spore(mappy, [2,1,1,1])

// renderBoard(mappy);


// const mapGen = function(){
//     let type;
//     do{
//         type =  germinate([.25,.5,.75,1]);
//     } while(!seeds[type].length)

//     let sprouted = sprout(mappy, seeds[type], type);
//     for(let i = 0; i < seeds.length; i++){
//       seeds[i] = seeds[i].filter((coord) => !(coord[0] === sprouted[0] && coord[1] === sprouted[1]));
//     }

//     console.log(sprouted);
//     console.log(seeds[type]);
//     renderBoard(mappy);
// }

//deletes a map from the atlas and decrements the index of all maps following it so that it is still correct.
const deleteMap = function(index){
  atlas = atlas.filter(map => map.index !== index);
  for(let i = index; i < atlas.length; i++){
    atlas[i].index--;
  }
}

let mappy;

const mapGen = function(){
  mappy = new mapObj(104);
  terraform(mappy);
//   renderBoard(mappy.mapData);
//   console.log(mappy);
};

//-------------------------------- END OF MAP GENERATOR ---------------------------------------------

const bmpData = function(mapData){
  this.height = mapData.length;
  this.width = mapData[0].length;
  this.data = parseMap(mapData);
}


//takes in a mapData to be processed and a resolution, and returns a buffer.
const parseMap = function(mapData, resolution){
  let paintArr = [];

  for(let i = 0 ; i < mapData.length; i++){
    paintRow(paintArr, mapData[i], resolution);
  }

  //return writer.flush(); idk what this does -KP
  //we're returning the buffer of octets -MZ
  return Buffer.from(paintArr);

}

// takes in a placeholder array to be pushed into a buffer, a row of mapData, and a resolution.
const paintRow = function(paintArr, dataArr, resolution){
  for(let i = 0; i< dataArr.length; i++){
    paintDot(paintArr, dataArr[i], resolution);
  }
  paintRow(paintArr, dataArr, resolution-1);
  let padding = (dataArr.length*resolution)%4;
  for(let i = 0; i <= padding; i++){
    paintArr.push(0x000000);
  }
}


const paintDot = function(arr, type, resolution){
//   writer.prototype.addInt32(terrainColors[type]);
  arr.push(terrainColors[type]);
  
  paintDot(type, resolution-1);
}

mapGen();
const rawData = bmp.encode(new bmpData(mappy.mapData));//default no compression,write rawData to .bmp file
fs.writeFileSync('map.bmp',rawData, console.log('I made a file!'));
