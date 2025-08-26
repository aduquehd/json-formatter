// Quick script to add missing translations to all language files

const newModalKeys = {
  "useExample": {
    "hi": "इस उदाहरण का उपयोग करें",
    "tr": "Bu örneği kullan",
    "nl": "Gebruik dit voorbeeld",
    "ms": "Gunakan contoh ini",
    "ta": "இந்த உதாரணத்தைப் பயன்படுத்து",
    "fy": "Brûk dit foarbyld",
    "nds": "Dit Bispeel bruken",
    "li": "Gebroek dit veurbeeld"
  }
};

const newExampleKeys = {
  "ecommerce": {
    "hi": "ई-कॉमर्स कैटलॉग",
    "tr": "E-ticaret Kataloğu",
    "nl": "E-commerce Catalogus",
    "ms": "Katalog E-dagang",
    "ta": "மின்-வணிக பட்டியல்",
    "fy": "E-commerce Katalogus",
    "nds": "E-Commerce Katalog",
    "li": "E-commerce Catalogus"
  },
  "financial": {
    "hi": "वित्तीय बिक्री",
    "tr": "Finansal Satışlar",
    "nl": "Financiële Verkopen",
    "ms": "Jualan Kewangan",
    "ta": "நிதி விற்பனை",
    "fy": "Finansjele Ferkeap",
    "nds": "Finanz Verkööp",
    "li": "Financiële Verkoupe"
  },
  "configuration": {
    "hi": "एप्लिकेशन कॉन्फ़िगरेशन",
    "tr": "Uygulama Yapılandırması",
    "nl": "Applicatie Configuratie",
    "ms": "Konfigurasi Aplikasi",
    "ta": "பயன்பாட்டு கட்டமைப்பு",
    "fy": "Applikaasje Konfiguraasje",
    "nds": "Anwendung Konfiguration",
    "li": "Applicatie Configuratie"
  },
  "geographic": {
    "hi": "भौगोलिक डेटा",
    "tr": "Coğrafi Veri",
    "nl": "Geografische Data",
    "ms": "Data Geografi",
    "ta": "புவியியல் தரவு",
    "fy": "Geografyske Data",
    "nds": "Geografisch Daten",
    "li": "Geografische Data"
  }
};

console.log("Add these translations to the respective language files:");
console.log(JSON.stringify({ newModalKeys, newExampleKeys }, null, 2));