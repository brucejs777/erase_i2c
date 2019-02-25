// erase_i2c.js

// cloud9 proj folder from prev code (not this project) = debian@beaglebone:/var/lib/cloud9/_MY_PROJ

/*
NOTE: I have a 24C02 (256x8) strapped as address 0x51 (A2-A0 = pin3-1 = 001)
2-22-19 trying i2c bus 2 on pins 24 and 26 - use config-pin -a p9_24 i2c etc
(must take original i2c mode off of pins 17-18 if set (but defaults to 'default')

erase a 24C16 I2C memory
note that the three address lines of the 24C16 A0-A2 are not used
instead, the chip must be addressed from $A0 to $AE (8-bit) or $50 to $57
note that the page size of the Microchip 24LC16B is 16 bytes
the 24LC16B page write time is max 5ms
uses BBB I2C port 2 on P9 pins 19=SCL and 20=SDA
pullups not included on BBB; 3.3 Volt bus
use 4.7k pullups to 3.3V and level translator or Schottkey diodes to +3.3V

linux cmd line i2c tools: list busses; list devices; set; dump
note bus number is zero-based; bbb uses bus 2 for p9-19/20 clk/data
i2cdetect -l // list buses
i2cdetect -r 2 // list devices found on bus
i2cset -y 2 0x50 0x02 0xbb // write one
i2cdump -y 2 0x50 b // get data b=bytes, w=words
*/


const i2c = require('i2c-bus');

// set up i/o pins for i2c1 on non-default pins of clk=24 amd dat=26
const { execSync } = require('child_process');
let execResult = "";
console.log('configuring i2c1 pins for sclk=24 and sdat=26');
try {
    execResult = execSync('config-pin -a P9_24 i2c');
    execResult = execSync('config-pin -a P9_26 i2c');
} catch(err) {
    console.log('ERROR: problem configuring i2c pins; err code = :\n', err);
}

process.stdout.write("process ver= " + process.version);

process.stdout.write('\n\terase_i2c.js - erase a 24C16 memory on Beaglebone Black I2C bus 2');

const MEMCHIP_ADDR = 0x51; // 7-bit bus address of the memory chip
const busNum = 1; // 0 is system, 1 is cape, 2 is P9 pins 19 & 20


const eraseMemory = (A2A1A0) => {
    console.log('\n\tErasing I2C memory device at address ' + MEMCHIP_ADDR);
    let byteAddr = 0x00; // address within the memory
    let testByte = 0xff; // test data

    const i2c1 = i2c.openSync(busNum);

    for (byteAddr = 0; byteAddr < 256; byteAddr++) {
        if (byteAddr % 8 === 0) {
            process.stdout.write("\n");
        }
        // write
        i2c1.writeByteSync(MEMCHIP_ADDR+A2A1A0, byteAddr, testByte);
        waitFor(5);
        process.stdout.write(byteAddr.toString(16) + ": " + testByte.toString(16) + " ");
    }
    process.stdout.write("\n");

    i2c1.closeSync();

}

// time delay
const waitFor = (ms) => {
    const date = new Date(new Date().getTime() + ms);
    while (date > new Date()) {
    }
    ;
}


try {
    let addressLines = 0;
    for (addressLines = 0; addressLines < 8; addressLines++) {
        console.log('erasing 256 bytes at address line= ', addressLines);
        eraseMemory(addressLines);
    }
} catch {
    console.log('skipping error...');
}

console.log('Finished');


