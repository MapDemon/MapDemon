const bmp = require('bmp-js');
const writer = new (require('buffer-writer')());
//bmpData={data:Buffer,width:Number,height:Height}

const fs = require('fs');

const terrainColors = [0xffff0000, 0xff888888, 0xff00ff88, 0xff00ff00];

const bmpData = function(mapData){
    this.height = mapData.length;
    this.width = mapdata[0].length;
    this.data = parseMap(mapData);
}

const parseMap = function(mapData, resolution){
    let colorArray = [];
    for(let i = 0 ; i < mapData.length; i++){
        paintRow(mapData[i], resolution);
    }

    return writer.flush();
}

// takes in a row of mapData and paints it into a buffer. returns the buffer.
const paintRow = function(arr, resolution){
    for(let i = 0; i< arr.length; i++){
        paintDot(arr[i], resolution);
    }
    paintRow(arr, resolution-1);
}


const paintDot = function(type, resolution){
    writer.addInt32(terrainColors[type]);
    paintMap(type, resolution-1);
}

const rawData = bmp.encode(bmpData(mappy.mapData));//default no compression,write rawData to .bmp file
fs.writeFileSync('map',rawData);