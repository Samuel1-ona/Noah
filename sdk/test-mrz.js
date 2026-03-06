import { validateCheckDigit, parseTD3 } from './src/utils/mrz.js';

// The Nigerian passport MRZ from the image
const trueLine1 = 'P<NGAONANIKE<<SAMUEL<CHISOM<<<<<<<<<<<<<<<<<';
const trueLine2 = 'B032991007NGA9905315M290425069830326924<<86';

function runTest() {
    console.log("Original parsed:", parseTD3(trueLine1, trueLine2));

    // Simulate OCR error: B read as 8
    const badLine2 = '8032991007NGA9905315M290425069830326924<<86';
    try {
        console.log("Parsing with OCR error (B->8):", parseTD3(trueLine1, badLine2));
    } catch (e) {
        console.error("Failed as expected:", e.message);
    }
}

runTest();
