import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
    en: {
        translation: {
            appName: "Yojana Setu",
            home: "Home",
            schemes: "Schemes",
            eligibility: "Check Eligibility",
            documents: "Documents",
            nearby: "Nearby Centers",
            search: "Search",
            aiAssistant: "AI Assistant",
            applyNow: "Apply Now",
        },
    },

    hi: {
        translation: {
            appName: "योजना सेतु",
            home: "होम",
            schemes: "योजनाएं",
            eligibility: "पात्रता जांचें",
            documents: "दस्तावेज़",
            nearby: "नजदीकी केंद्र",
            search: "खोजें",
            aiAssistant: "AI सहायक",
            applyNow: "अभी आवेदन करें",
        },
    },

    te: {
        translation: {
            appName: "యోజన సేతు",
            home: "హోమ్",
            schemes: "పథకాలు",
            eligibility: "అర్హతను తనిఖీ చేయండి",
            documents: "పత్రాలు",
            nearby: "సమీప కేంద్రాలు",
            search: "శోధించండి",
            aiAssistant: "AI సహాయకుడు",
            applyNow: "ఇప్పుడే దరఖాస్తు చేయండి",
        },
    },

    ta: {
        translation: {
            appName: "யோஜனா சேது",
            home: "முகப்பு",
            schemes: "திட்டங்கள்",
            eligibility: "தகுதியை சரிபார்க்கவும்",
            documents: "ஆவணங்கள்",
            nearby: "அருகிலுள்ள மையங்கள்",
            search: "தேடுக",
            aiAssistant: "AI உதவியாளர்",
            applyNow: "இப்போது விண்ணப்பிக்கவும்",
        },
    },
};

i18n.use(initReactI18next).init({
    resources,
    lng: "en",
    fallbackLng: "en",
    interpolation: {
        escapeValue: false,
    },
});

export default i18n;