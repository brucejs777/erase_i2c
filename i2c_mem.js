// i2c_mem.js

// test access to i2c memory from bbb using direct node.js code
// no web, no bonescript (because I want to port to other sbc)

// linux cmd line i2c tools: list busses; list devices; set; dump
// i2cdetect -l
// i2cdetect -r 2
// i2cset -y 2 0x50 0x02 0xbb
// i2cdump -y 2 0x50 b

// TODO:  use try/catch around sync access


const i2c = require('i2c-bus');

const MEMCHIP_ADDR = 0x51; // 7-bit bus address of the memory chip
const busNum = 2; // 0 is system, 1 is cape, 2 is P9 pins 19 & 20


const testMemory = () => {
    console.log('\nTesting I2C memory device at address ' + MEMCHIP_ADDR);
    var byteAddr = 0x04; // address within the memory
    var testByte = 0xab; // test data
    var resultData = 0x00; // returned test data
    
    const i2c1 = i2c.openSync(busNum);
    
    // write, then read back
    i2c1.writeByteSync(MEMCHIP_ADDR, byteAddr, testByte);
    resultData = i2c1.readByteSync(MEMCHIP_ADDR, byteAddr);
    
    console.log('addr = ' + byteAddr + '; sent = ' + testByte + '; got = ' + resultData);
    
    i2c1.closeSync();
};


testMemory();
console.log('Finished');
