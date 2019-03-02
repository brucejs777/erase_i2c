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
process.stdout.write('\n\terase_i2c.js - erase a 24C16 memory on Beaglebone Black I2C bus 1');

const i2c = require('i2c-bus');

const configPins = () => {
// set up i/o pins for i2c1 on non-default pins of clk=24 amd dat=26
    console.log(`configuring i2c1 pins for SCL=24 and SDA=26`);

    const {execSync} = require('child_process');

    let execResult;
    try {
        execResult = execSync('config-pin -a P9_24 i2c');
        console.log(execResult);
        execResult = execSync('config-pin -a P9_26 i2c');
        console.log(execResult);
    } catch (err) {
        console.log(`ERROR: problem configuring i2c pins; err code = ${er}\n`);
    }
};


// erase the i2c eeprom memory at address A2A1A0
// chip page size pageSize
const eraseMemory = (
    busNum, i2cAddress,
    numBytes, fillByte=0xff, pageSize=16
) => {
    let startLoc = 0; // TODO: make this a param
    let bytesWritten = 0;
    console.log(`\n\tErasing I2C memory device at address ${i2cAddress.toString(16)}`);

    const i2c1 = i2c.openSync(busNum);
    const erasedData = Buffer.alloc(pageSize, fillByte);

    for (let byteAddr = startLoc; byteAddr < startLoc + numBytes; byteAddr += pageSize) {
        bytesWritten = i2c1.i2cWriteSync(i2cAddress, pageSize, erasedData);
        waitFor(5);
        process.stdout.write(`number wrote = ${bytesWritten}\n`);
        if (bytesWritten !== pageSize) {
            process.stdout.write(`Error: not all bytes written`);
        }
    }
    process.stdout.write("\n");

    i2c1.closeSync();
};


const readMemory = (
    busNum, i2cAddress,
    numBytes, fillByte=0xff, pageSize=16
) => {
    assert.fail('not done yet');
    let startLoc = 0; // TODO: make this a param
    let readData = 0;
    console.log(`\n\tErasing I2C memory device at address ${i2cAddress.toString(16)}`);
    const i2c1 = i2c.openSync(busNum);

    for (let byteAddr = startLoc; byteAddr < startLoc + numBytes; byteAddr++) {
        if (byteAddr % pageSize === 0) {
            process.stdout.write(`\n${ ("0" + byteAddr.toString(16)).slice(-2) } : `);
        }
        if (byteAddr % (pageSize/2) === 0 && pageSize === 16) {
            process.stdout.write(" ");
        }
        // write
        readData = i2c1.readByteSync(i2cAddress, byteAddr, fillByte);
        //waitFor(5);
        process.stdout.write(readData.toString(16) + " ");
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
    let testByte = 0xff; // test data

    configPins();

    // write same byte to all spec mem locs
    try {
        for (let addressLines = A2A1A0start; addressLines <= A2A1A0end; addressLines++) {
            console.log('erasing 256 bytes at address line= ',
                addressLines.toString(16));
            eraseMemory( i2cBusNum, MEMCHIP_ADDR + addressLines,
                regionSize, testByte, chipPageSize);
        }
    } catch (err) {
        console.log(`main(): caught error in erase; aborting op, err = ${err}`);
    }

    console.log(`Finished;  ET = ${ (Date.now() - startTime) / 1000 } secs`);
};


main();

