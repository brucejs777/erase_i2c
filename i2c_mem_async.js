// i2c_mem_async.js

// test access to i2c memory from bbb using direct node.js code
// no web, no bonescript (because I want to port to other sbc)

// linux cmd line i2c tools: list busses; list devices; set; dump
// i2cdetect -l
// i2cdetect -r 2
// i2cset -y 2 0x50 0x02 0xbb
// i2cdump -y 2 0x50 b

// TODO:  use try/catch around sync access
//
// ---------------------------------------------------------------------------

// ----------------------------- Dependencies --------------------------------
//
//const async = require('async');
const i2c = require('i2c-bus');


// ------------------------------ Class Data ---------------------------------
//
const MEMCHIP_ADDR = 0x51; // 7-bit bus address of the memory chip
// address is st 1010 a2 a1 a0 r/w ack
const busNum = 2; // 0 is system, 1 is cape, 2 is P9 pins 19 & 20

var byteAddr = 0x07; // address within the memory
var testByte = 0x81; // test data
var resultData = 0x00; // returned test data
var memSize = 128; // 2048 for 24C16 - bytes
var pageSize = 8; // 16 for 24C16 2kx8 
var numPages = memSize / pageSize; // 128 for 24C16
// 'same page' means that al bits A10 thru A4 are kept constant for the 16 locs
// otherwise it'll wrap around !


// -------------------------------- Functs -----------------------------------
//

// test one page with a page data of given page size (bytes)
// return err code = 0 if OK
const testPage = function(page_num, byte_array, array_size) {
    //TODO: this
}


// overall memory test control
// returns err = 0 if OK
const testMemory = function() {
    var err = 0;
    console.log('\nTesting I2C memory device at address ' + MEMCHIP_ADDR);
    
    // open i2c bus 2 on bbb
    const i2c1 = i2c.open(busNum, open_ccb);

    // write, then read back the memory
    i2c1.writeByte(MEMCHIP_ADDR, byteAddr, testByte, write_ccb);
    for (ii = 0; ii < 100000; ii++) {}
    i2c1.readByte(MEMCHIP_ADDR, byteAddr, read_ccb);
    
    // close the i2c bus, we're done with it
    i2c1.close(close_ccb);
    
    return err;
};


// i2c open completion callback:
const open_ccb = (err) => {
    console.log('i2c open ccb: err = ' + err);
    if (err) throw err;
}

// i2c close completion callback:
const close_ccb = (err) => {
    console.log('i2c close ccb: err = ' + err);
    if (err) throw err;
}

// i2c write completion callback:
const write_ccb = (err) => {
    console.log('i2c write ccb: err = ' + err);
    if (err) throw err;
}

// i2c read completion callback:
const read_ccb = (err, data) => {
    console.log('i2c read ccb: err = ' + err);
    if (err) throw err;
    console.log('i2c read data = ' + data);
    resultData = data;
}


// -------------------------------- Main--------------------------------------
//
var testErr = 0;
testErr = testMemory();
console.log('waiting for i2c result...');
setTimeout(function(){console.log('finished');}, 1000);
console.log('addr = ' + byteAddr + '; sent = ' + testByte + '; got = ' + resultData);



