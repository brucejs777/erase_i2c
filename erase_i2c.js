// erase_i2c.js


// erase a 24C16 I2C memory

// this was a cloud9 proj folder from prev code (not this project) = debian@beaglebone:/var/lib/cloud9/_MY_PROJ

/*
    webstorm notes

ran in 13.1 secs for 2048 individual writes (no paging)

    hardware notes
NOTE: I HAD (before end of Feg '19) a 24C02 (256x8) strapped
as address 0x51 (A2-A0 = pin3-1 = 001)
( before we used BBB I2C port 2 on P9 pins 19=SCL and 20=SDA)
but now using SCL=pin24 and SDA=pin26

2-22-19 trying i2c bus 1 on pins 24 and 26 - use config-pin -a p9_24 i2c etc
(must take original i2c mode off of pins 17-18 if set (but defaults to 'default')

note that the three address lines of the 24C16 A0-A2 are not used
instead, the chip must be addressed from $A0 to $AE (8-bit) or $50 to $57

pullups not included on BBB; 3.3 Volt bus
use 4.7k pullups to 3.3V and level translator or Schottkey diodes to +3.3V
note: if connecting to  5V system then really only need pullups to 3.3V

    i2c notes
note that the page size of the Microchip 24LC16B is 16 bytes
the 24LC16B page write time is max 5ms

    linux i2c-tools cmd line tools: list busses; list devices; set; dump
note bus number is zero-based; bbb uses bus 2 for p9-19/20 clk/data
i2cdetect -l // list buses
i2cdetect -r 2 // list devices found on bus
i2cset -y 2 0x50 0x02 0xbb // write one
i2cdump -y 2 0x50 b // get data b=bytes, w=words
*/


const assert = require('assert');

process.stdout.write(`process ver = ${process.version}`);
process.stdout.write('\n\terase_i2c.js - erase a 24C16 memory on Beaglebone Black I2C bus 1 \n');

const i2c = require('i2c-bus');


// set up i/o pins for i2c1 on non-default pins of clk=24 amd dat=26
const configPins = () => {
    console.log(`configuring i2c1 pins for SCL=24 and SDA=26`);

    const {execSync} = require('child_process');

    let execResult;
    try {
        execResult = execSync('config-pin -a P9_24 i2c');
        console.log(execResult.toString());
        execResult = execSync('config-pin -a P9_26 i2c');
        console.log(execResult.toString());
    } catch (err) {
        console.log(`ERROR: problem configuring i2c pins; err code = ${er}\n`);
    }
};


// set array of various test patterns of bytes for memory testing
// array can be shared memory of a Buffer using Buffer.from(array.buffer)
// x is fast and horiz, y is slower and vert, z is slowest
const makeTestData = function(ary, size, y, z) {
    for (let x = 0; x < size; x++) {
        ary[x] = (x + z) % 16; // lower nibble, counts w/ offset
        ary[x] |= (y & 0xf0); // upper nibble
    }
};


// erase the i2c eeprom memory at address A2A1A0
// chip page size pageSize
// TODO: temp using test data pattern instead of all ones to debug
const eraseMemory = (
    busNum, i2cAddress,
    numBytes, fillByte, pageSize
) => {
    let startLoc = 0; // TODO: make this a param
    let bytesWritten = 0;
    let chipArray = new Uint8Array(16);
    let chipBuf = Buffer.from(chipArray.buffer); // shared memory

    console.log(`\n\teraseMemory(): Erasing ${numBytes} of I2C memory device \n`
    + `at address ${i2cAddress.toString(16)} on bus # ${busNum};  \n`
    + `fill byte = ${fillByte.toString(16)}, page size = ${pageSize}`);

    const i2c1 = i2c.openSync(busNum);
    // TODO: const chipBuf = Buffer.alloc(pageSize, fillByte);

    for (let byteAddr = startLoc; byteAddr < startLoc + numBytes; byteAddr += pageSize) {
        makeTestData(chipArray, pageSize, byteAddr & 0xf0, i2cAddress & 0x0f);
        console.log(`chip=${i2cAddress.toString(16)}; `
            + `mem addr=${byteAddr.toString(16)}; `
            + `data=${ chipArray.map(val => val.toString(16)) }`);
            //+ `data=${ chipArray }`);
        bytesWritten = i2c1.i2cWriteSync(i2cAddress, pageSize, chipBuf);
        waitFor(5);
        //process.stdout.write(`number wrote = ${bytesWritten}\n`);
        if (bytesWritten !== pageSize) {
            process.stdout.write(`Error: not all bytes written`);
        }
    }
    process.stdout.write("\n");

    i2c1.closeSync();
};


// time delay
// we need this because the hardware has a 5ms write time
// - until ack polling is tested at least (not sure if lib can do it)
const waitFor = (ms) => {
    const date = new Date(new Date().getTime() + ms);
    while (date > new Date()) {
    }
};


// *** *** *** App Main *** *** ***
//
const main = () => {
    let startTime = Date.now();
    let i2cBusNum = 1;
    let MEMCHIP_ADDR = 0x50; // 7-bit bus address of the memory chip
    let A2A1A0start = 0;
    let A2A1A0end = 7;
    let byteOffset = 0;
    let totalMemSize = 2048;
    let regionSize = totalMemSize < 256 ? totalMemSize : 256;
    let chipPageSize = 16;
    let testByte = 0; // test data

    configPins();

    // write same byte to all spec mem locs
    try {
        for (let addressLines = A2A1A0start; addressLines <= A2A1A0end; addressLines++) {
            console.log(`erasing ${regionSize} bytes at address line = ${addressLines.toString(16)}` );
            eraseMemory( i2cBusNum, MEMCHIP_ADDR + addressLines,
                regionSize, testByte, chipPageSize);
        }
    } catch (err) {
        console.log(`main(): caught error in erase; aborting op, err = ${err}`);
    }

    console.log(`Finished;  ET = ${ (Date.now() - startTime) / 1000 } secs`);
};


// Just call main()
main();

