import { useEffect, useRef, useState } from "react";
import { extractProfileFromVoiceText } from "../utils/voiceProfileParser";

const defaultProfileShape = {
    age: "",
    applicantType: "",
    businessType: "",
    businessStatus: "",
    state: "",
    district: "",
    turnover: "",
    loanAmount: "",
    womanEntrepreneur: false,
    scSt: false,
    rural: false,
    disability: false,
};

const STATES = [
    {
        name: "Andhra Pradesh",
        districts: [
            "Alluri Sitharama Raju",
            "Anakapalli",
            "Ananthapuramu",
            "Annamayya",
            "Bapatla",
            "Chittoor",
            "Dr. B.R. Ambedkar Konaseema",
            "East Godavari",
            "Eluru",
            "Guntur",
            "Kakinada",
            "Krishna",
            "Kurnool",
            "Nandyal",
            "NTR",
            "Palnadu",
            "Parvathipuram Manyam",
            "Prakasam",
            "Sri Potti Sriramulu Nellore",
            "Sri Sathya Sai",
            "Srikakulam",
            "Tirupati",
            "Visakhapatnam",
            "Vizianagaram",
            "West Godavari",
            "YSR Kadapa",
        ],
    },
    {
        name: "Arunachal Pradesh",
        districts: [
            "Anjaw",
            "Changlang",
            "Dibang Valley",
            "East Kameng",
            "East Siang",
            "Itanagar Capital Complex",
            "Kamle",
            "Kra Daadi",
            "Kurung Kumey",
            "Lepa Rada",
            "Lohit",
            "Longding",
            "Lower Dibang Valley",
            "Lower Siang",
            "Lower Subansiri",
            "Namsai",
            "Pakke Kessang",
            "Papum Pare",
            "Shi Yomi",
            "Siang",
            "Tawang",
            "Tirap",
            "Upper Siang",
            "Upper Subansiri",
            "West Kameng",
            "West Siang",
        ],
    },
    {
        name: "Assam",
        districts: [
            "Baksa",
            "Barpeta",
            "Biswanath",
            "Bongaigaon",
            "Cachar",
            "Charaideo",
            "Chirang",
            "Darrang",
            "Dhemaji",
            "Dhubri",
            "Dibrugarh",
            "Dima Hasao",
            "Goalpara",
            "Golaghat",
            "Hailakandi",
            "Hojai",
            "Jorhat",
            "Kamrup",
            "Kamrup Metropolitan",
            "Karbi Anglong",
            "Karimganj",
            "Kokrajhar",
            "Lakhimpur",
            "Majuli",
            "Morigaon",
            "Nagaon",
            "Nalbari",
            "Sivasagar",
            "Sonitpur",
            "South Salmara-Mankachar",
            "Tamulpur",
            "Tinsukia",
            "Udalguri",
            "West Karbi Anglong",
        ],
    },
    {
        name: "Bihar",
        districts: [
            "Araria",
            "Arwal",
            "Aurangabad",
            "Banka",
            "Begusarai",
            "Bhagalpur",
            "Bhojpur",
            "Buxar",
            "Darbhanga",
            "East Champaran",
            "Gaya",
            "Gopalganj",
            "Jamui",
            "Jehanabad",
            "Kaimur",
            "Katihar",
            "Khagaria",
            "Kishanganj",
            "Lakhisarai",
            "Madhepura",
            "Madhubani",
            "Munger",
            "Muzaffarpur",
            "Nalanda",
            "Nawada",
            "Patna",
            "Purnia",
            "Rohtas",
            "Saharsa",
            "Samastipur",
            "Saran",
            "Sheikhpura",
            "Sheohar",
            "Sitamarhi",
            "Siwan",
            "Supaul",
            "Vaishali",
            "West Champaran",
        ],
    },
    {
        name: "Chhattisgarh",
        districts: [
            "Balod",
            "Baloda Bazar-Bhatapara",
            "Balrampur-Ramanujganj",
            "Bastar",
            "Bemetara",
            "Bijapur",
            "Bilaspur",
            "Dantewada",
            "Dhamtari",
            "Durg",
            "Gariaband",
            "Gaurela-Pendra-Marwahi",
            "Janjgir-Champa",
            "Jashpur",
            "Kabirdham",
            "Kanker",
            "Khairagarh-Chhuikhadan-Gandai",
            "Kondagaon",
            "Korba",
            "Koriya",
            "Mahasamund",
            "Manendragarh-Chirmiri-Bharatpur",
            "Mohla-Manpur-Ambagarh Chowki",
            "Mungeli",
            "Narayanpur",
            "Raigarh",
            "Raipur",
            "Rajnandgaon",
            "Sakti",
            "Sarangarh-Bilaigarh",
            "Sukma",
            "Surajpur",
            "Surguja",
        ],
    },
    {
        name: "Goa",
        districts: ["North Goa", "South Goa"],
    },
    {
        name: "Gujarat",
        districts: [
            "Ahmedabad",
            "Amreli",
            "Anand",
            "Aravalli",
            "Banaskantha",
            "Bharuch",
            "Bhavnagar",
            "Botad",
            "Chhota Udaipur",
            "Dahod",
            "Dang",
            "Devbhumi Dwarka",
            "Gandhinagar",
            "Gir Somnath",
            "Jamnagar",
            "Junagadh",
            "Kheda",
            "Kutch",
            "Mahisagar",
            "Mehsana",
            "Morbi",
            "Narmada",
            "Navsari",
            "Panchmahal",
            "Patan",
            "Porbandar",
            "Rajkot",
            "Sabarkantha",
            "Surat",
            "Surendranagar",
            "Tapi",
            "Vadodara",
            "Valsad",
        ],
    },
    {
        name: "Haryana",
        districts: [
            "Ambala",
            "Bhiwani",
            "Charkhi Dadri",
            "Faridabad",
            "Fatehabad",
            "Gurugram",
            "Hisar",
            "Jhajjar",
            "Jind",
            "Kaithal",
            "Karnal",
            "Kurukshetra",
            "Mahendragarh",
            "Nuh",
            "Palwal",
            "Panchkula",
            "Panipat",
            "Rewari",
            "Rohtak",
            "Sirsa",
            "Sonipat",
            "Yamunanagar",
        ],
    },
    {
        name: "Himachal Pradesh",
        districts: [
            "Bilaspur",
            "Chamba",
            "Hamirpur",
            "Kangra",
            "Kinnaur",
            "Kullu",
            "Lahaul and Spiti",
            "Mandi",
            "Shimla",
            "Sirmaur",
            "Solan",
            "Una",
        ],
    },
    {
        name: "Jharkhand",
        districts: [
            "Bokaro",
            "Chatra",
            "Deoghar",
            "Dhanbad",
            "Dumka",
            "East Singhbhum",
            "Garhwa",
            "Giridih",
            "Godda",
            "Gumla",
            "Hazaribagh",
            "Jamtara",
            "Khunti",
            "Koderma",
            "Latehar",
            "Lohardaga",
            "Pakur",
            "Palamu",
            "Ramgarh",
            "Ranchi",
            "Sahebganj",
            "Seraikela Kharsawan",
            "Simdega",
            "West Singhbhum",
        ],
    },
    {
        name: "Karnataka",
        districts: [
            "Bagalkote",
            "Ballari",
            "Belagavi",
            "Bengaluru Rural",
            "Bengaluru Urban",
            "Bidar",
            "Chamarajanagar",
            "Chikkaballapura",
            "Chikkamagaluru",
            "Chitradurga",
            "Dakshina Kannada",
            "Davanagere",
            "Dharwad",
            "Gadag",
            "Hassan",
            "Haveri",
            "Kalaburagi",
            "Kodagu",
            "Kolar",
            "Koppal",
            "Mandya",
            "Mysuru",
            "Raichur",
            "Ramanagara",
            "Shivamogga",
            "Tumakuru",
            "Udupi",
            "Uttara Kannada",
            "Vijayanagara",
            "Vijayapura",
            "Yadgir",
        ],
    },
    {
        name: "Kerala",
        districts: [
            "Alappuzha",
            "Ernakulam",
            "Idukki",
            "Kannur",
            "Kasaragod",
            "Kollam",
            "Kottayam",
            "Kozhikode",
            "Malappuram",
            "Palakkad",
            "Pathanamthitta",
            "Thiruvananthapuram",
            "Thrissur",
            "Wayanad",
        ],
    },
    {
        name: "Madhya Pradesh",
        districts: [
            "Agar Malwa",
            "Alirajpur",
            "Anuppur",
            "Ashoknagar",
            "Balaghat",
            "Barwani",
            "Betul",
            "Bhind",
            "Bhopal",
            "Burhanpur",
            "Chhatarpur",
            "Chhindwara",
            "Damoh",
            "Datia",
            "Dewas",
            "Dhar",
            "Dindori",
            "Guna",
            "Gwalior",
            "Harda",
            "Hoshangabad",
            "Indore",
            "Jabalpur",
            "Jhabua",
            "Katni",
            "Khandwa",
            "Khargone",
            "Maihar",
            "Mandla",
            "Mandsaur",
            "Mauganj",
            "Morena",
            "Narsinghpur",
            "Neemuch",
            "Niwari",
            "Pandhurna",
            "Panna",
            "Raisen",
            "Rajgarh",
            "Ratlam",
            "Rewa",
            "Sagar",
            "Satna",
            "Sehore",
            "Seoni",
            "Shahdol",
            "Shajapur",
            "Sheopur",
            "Shivpuri",
            "Sidhi",
            "Singrauli",
            "Tikamgarh",
            "Ujjain",
            "Umaria",
            "Vidisha",
        ],
    },
    {
        name: "Maharashtra",
        districts: [
            "Ahmednagar",
            "Akola",
            "Amravati",
            "Beed",
            "Bhandara",
            "Buldhana",
            "Chandrapur",
            "Chhatrapati Sambhajinagar",
            "Dharashiv",
            "Dhule",
            "Gadchiroli",
            "Gondia",
            "Hingoli",
            "Jalgaon",
            "Jalna",
            "Kolhapur",
            "Latur",
            "Mumbai City",
            "Mumbai Suburban",
            "Nagpur",
            "Nanded",
            "Nandurbar",
            "Nashik",
            "Palghar",
            "Parbhani",
            "Pune",
            "Raigad",
            "Ratnagiri",
            "Sangli",
            "Satara",
            "Sindhudurg",
            "Solapur",
            "Thane",
            "Wardha",
            "Washim",
            "Yavatmal",
        ],
    },
    {
        name: "Manipur",
        districts: [
            "Bishnupur",
            "Chandel",
            "Churachandpur",
            "Imphal East",
            "Imphal West",
            "Jiribam",
            "Kakching",
            "Kamjong",
            "Kangpokpi",
            "Noney",
            "Pherzawl",
            "Senapati",
            "Tamenglong",
            "Tengnoupal",
            "Thoubal",
            "Ukhrul",
        ],
    },
    {
        name: "Meghalaya",
        districts: [
            "East Garo Hills",
            "East Jaintia Hills",
            "East Khasi Hills",
            "Eastern West Khasi Hills",
            "North Garo Hills",
            "Ri-Bhoi",
            "South Garo Hills",
            "South West Garo Hills",
            "South West Khasi Hills",
            "West Garo Hills",
            "West Jaintia Hills",
            "West Khasi Hills",
        ],
    },
    {
        name: "Mizoram",
        districts: [
            "Aizawl",
            "Champhai",
            "Hnahthial",
            "Khawzawl",
            "Kolasib",
            "Lawngtlai",
            "Lunglei",
            "Mamit",
            "Saiha",
            "Saitual",
            "Serchhip",
        ],
    },
    {
        name: "Nagaland",
        districts: [
            "Chümoukedima",
            "Dimapur",
            "Kiphire",
            "Kohima",
            "Longleng",
            "Mokokchung",
            "Mon",
            "Niuland",
            "Noklak",
            "Peren",
            "Phek",
            "Shamator",
            "Tseminyü",
            "Tuensang",
            "Wokha",
            "Zünheboto",
        ],
    },
    {
        name: "Odisha",
        districts: [
            "Angul",
            "Balangir",
            "Balasore",
            "Bargarh",
            "Bhadrak",
            "Boudh",
            "Cuttack",
            "Deogarh",
            "Dhenkanal",
            "Gajapati",
            "Ganjam",
            "Jagatsinghpur",
            "Jajpur",
            "Jharsuguda",
            "Kalahandi",
            "Kandhamal",
            "Kendrapara",
            "Kendujhar",
            "Khordha",
            "Koraput",
            "Malkangiri",
            "Mayurbhanj",
            "Nabarangpur",
            "Nayagarh",
            "Nuapada",
            "Puri",
            "Rayagada",
            "Sambalpur",
            "Subarnapur",
            "Sundargarh",
        ],
    },
    {
        name: "Punjab",
        districts: [
            "Amritsar",
            "Barnala",
            "Bathinda",
            "Faridkot",
            "Fatehgarh Sahib",
            "Fazilka",
            "Ferozepur",
            "Gurdaspur",
            "Hoshiarpur",
            "Jalandhar",
            "Kapurthala",
            "Ludhiana",
            "Malerkotla",
            "Mansa",
            "Moga",
            "Pathankot",
            "Patiala",
            "Rupnagar",
            "Sahibzada Ajit Singh Nagar",
            "Sangrur",
            "Shahid Bhagat Singh Nagar",
            "Sri Muktsar Sahib",
            "Tarn Taran",
        ],
    },
    {
        name: "Rajasthan",
        districts: [
            "Ajmer",
            "Alwar",
            "Anupgarh",
            "Balotra",
            "Banswara",
            "Baran",
            "Barmer",
            "Beawar",
            "Bharatpur",
            "Bhilwara",
            "Bikaner",
            "Bundi",
            "Chittorgarh",
            "Churu",
            "Dausa",
            "Deeg",
            "Dholpur",
            "Didwana-Kuchaman",
            "Dudu",
            "Dungarpur",
            "Gangapur City",
            "Hanumangarh",
            "Jaipur",
            "Jaipur Rural",
            "Jaisalmer",
            "Jalore",
            "Jhalawar",
            "Jhunjhunu",
            "Jodhpur",
            "Jodhpur Rural",
            "Karauli",
            "Kekri",
            "Khairthal-Tijara",
            "Kota",
            "Kotputli-Behror",
            "Nagaur",
            "Neem Ka Thana",
            "Pali",
            "Phalodi",
            "Pratapgarh",
            "Rajsamand",
            "Salumbar",
            "Sanchore",
            "Sawai Madhopur",
            "Shahpura",
            "Sikar",
            "Sirohi",
            "Sri Ganganagar",
            "Tonk",
            "Udaipur",
        ],
    },
    {
        name: "Sikkim",
        districts: ["Gangtok", "Gyalshing", "Mangan", "Namchi", "Pakyong", "Soreng"],
    },
    {
        name: "Tamil Nadu",
        districts: [
            "Ariyalur",
            "Chengalpattu",
            "Chennai",
            "Coimbatore",
            "Cuddalore",
            "Dharmapuri",
            "Dindigul",
            "Erode",
            "Kallakurichi",
            "Kanchipuram",
            "Kanyakumari",
            "Karur",
            "Krishnagiri",
            "Madurai",
            "Mayiladuthurai",
            "Nagapattinam",
            "Namakkal",
            "Nilgiris",
            "Perambalur",
            "Pudukkottai",
            "Ramanathapuram",
            "Ranipet",
            "Salem",
            "Sivaganga",
            "Tenkasi",
            "Thanjavur",
            "Theni",
            "Thoothukudi",
            "Tiruchirappalli",
            "Tirunelveli",
            "Tirupathur",
            "Tiruppur",
            "Tiruvallur",
            "Tiruvannamalai",
            "Tiruvarur",
            "Vellore",
            "Viluppuram",
            "Virudhunagar",
        ],
    },
    {
        name: "Telangana",
        districts: [
            "Adilabad",
            "Bhadradri Kothagudem",
            "Hanumakonda",
            "Jagtial",
            "Jangaon",
            "Jayashankar Bhupalpally",
            "Jogulamba Gadwal",
            "Kamareddy",
            "Karimnagar",
            "Khammam",
            "Kumuram Bheem Asifabad",
            "Mahabubabad",
            "Mahbubnagar",
            "Mancherial",
            "Medak",
            "Medchal-Malkajgiri",
            "Mulugu",
            "Nagarkurnool",
            "Nalgonda",
            "Narayanpet",
            "Nirmal",
            "Nizamabad",
            "Peddapalli",
            "Rajanna Sircilla",
            "Ranga Reddy",
            "Sangareddy",
            "Siddipet",
            "Suryapet",
            "Vikarabad",
            "Wanaparthy",
            "Warangal",
            "Yadadri Bhuvanagiri",
        ],
    },
    {
        name: "Tripura",
        districts: [
            "Dhalai",
            "Gomati",
            "Khowai",
            "North Tripura",
            "Sepahijala",
            "South Tripura",
            "Unakoti",
            "West Tripura",
        ],
    },
    {
        name: "Uttar Pradesh",
        districts: [
            "Agra",
            "Aligarh",
            "Ambedkar Nagar",
            "Amethi",
            "Amroha",
            "Auraiya",
            "Ayodhya",
            "Azamgarh",
            "Baghpat",
            "Bahraich",
            "Ballia",
            "Balrampur",
            "Banda",
            "Barabanki",
            "Bareilly",
            "Basti",
            "Bhadohi",
            "Bijnor",
            "Budaun",
            "Bulandshahr",
            "Chandauli",
            "Chitrakoot",
            "Deoria",
            "Etah",
            "Etawah",
            "Farrukhabad",
            "Fatehpur",
            "Firozabad",
            "Gautam Buddha Nagar",
            "Ghaziabad",
            "Ghazipur",
            "Gonda",
            "Gorakhpur",
            "Hamirpur",
            "Hapur",
            "Hardoi",
            "Hathras",
            "Jalaun",
            "Jaunpur",
            "Jhansi",
            "Kannauj",
            "Kanpur Dehat",
            "Kanpur Nagar",
            "Kasganj",
            "Kaushambi",
            "Kheri",
            "Kushinagar",
            "Lalitpur",
            "Lucknow",
            "Maharajganj",
            "Mahoba",
            "Mainpuri",
            "Mathura",
            "Mau",
            "Meerut",
            "Mirzapur",
            "Moradabad",
            "Muzaffarnagar",
            "Pilibhit",
            "Pratapgarh",
            "Prayagraj",
            "Raebareli",
            "Rampur",
            "Saharanpur",
            "Sambhal",
            "Sant Kabir Nagar",
            "Shahjahanpur",
            "Shamli",
            "Shravasti",
            "Siddharthnagar",
            "Sitapur",
            "Sonbhadra",
            "Sultanpur",
            "Unnao",
            "Varanasi",
        ],
    },
    {
        name: "Uttarakhand",
        districts: [
            "Almora",
            "Bageshwar",
            "Chamoli",
            "Champawat",
            "Dehradun",
            "Haridwar",
            "Nainital",
            "Pauri Garhwal",
            "Pithoragarh",
            "Rudraprayag",
            "Tehri Garhwal",
            "Udham Singh Nagar",
            "Uttarkashi",
        ],
    },
    {
        name: "West Bengal",
        districts: [
            "Alipurduar",
            "Bankura",
            "Birbhum",
            "Cooch Behar",
            "Dakshin Dinajpur",
            "Darjeeling",
            "Hooghly",
            "Howrah",
            "Jalpaiguri",
            "Jhargram",
            "Kalimpong",
            "Kolkata",
            "Malda",
            "Murshidabad",
            "Nadia",
            "North 24 Parganas",
            "Paschim Bardhaman",
            "Paschim Medinipur",
            "Purba Bardhaman",
            "Purba Medinipur",
            "Purulia",
            "South 24 Parganas",
            "Uttar Dinajpur",
        ],
    },
    {
        name: "Andaman and Nicobar Islands",
        districts: ["Nicobar", "North and Middle Andaman", "South Andaman"],
    },
    {
        name: "Chandigarh",
        districts: ["Chandigarh"],
    },
    {
        name: "Dadra and Nagar Haveli and Daman and Diu",
        districts: ["Dadra and Nagar Haveli", "Daman", "Diu"],
    },
    {
        name: "Delhi",
        districts: [
            "Central Delhi",
            "East Delhi",
            "New Delhi",
            "North Delhi",
            "North East Delhi",
            "North West Delhi",
            "Shahdara",
            "South Delhi",
            "South East Delhi",
            "South West Delhi",
            "West Delhi",
        ],
    },
    {
        name: "Jammu and Kashmir",
        districts: [
            "Anantnag",
            "Bandipora",
            "Baramulla",
            "Budgam",
            "Doda",
            "Ganderbal",
            "Jammu",
            "Kathua",
            "Kishtwar",
            "Kulgam",
            "Kupwara",
            "Poonch",
            "Pulwama",
            "Rajouri",
            "Ramban",
            "Reasi",
            "Samba",
            "Shopian",
            "Srinagar",
            "Udhampur",
        ],
    },
    {
        name: "Ladakh",
        districts: ["Kargil", "Leh"],
    },
    {
        name: "Lakshadweep",
        districts: ["Lakshadweep"],
    },
    {
        name: "Puducherry",
        districts: ["Karaikal", "Mahe", "Puducherry", "Yanam"],
    },
];

const stateDistricts = STATES.reduce((acc, curr) => {
    acc[curr.name] = curr.districts;
    return acc;
}, {});

const states = STATES.map((item) => item.name).sort();
const businessSuggestions = ["Textile", "Tailoring", "Food Processing", "Retail", "Manufacturing", "Agriculture", "Services", "Handicraft"];
const additionalOptions = [
    ["womanEntrepreneur", "Woman Entrepreneur", "female", "Special grants and higher subsidy allocations under Central and State schemes."],
    ["scSt", "SC / ST Category", "diversity_3", "Special category subsidies, lower margin requirements, and priority processing."],
    ["rural", "Rural Enterprise", "landscape", "Higher subsidy ceilings for enterprises located in rural and notified areas."],
    ["disability", "Person with Disability", "accessible", "Concessional interest rates and reserved quotas in institutional credit."],
];

const formatMoneyValue = (value) => {
    if (!value && value !== 0) return "";
    const digits = String(value).replace(/\D/g, "");
    if (!digits) return "";
    return `₹${Number(digits).toLocaleString("en-IN")}`;
};

const getRecognitionLanguage = (lng) => ({ en: "en-IN", hi: "hi-IN", te: "te-IN", ta: "ta-IN" }[lng] || "en-IN");

const PROFILE_DRAFT_STORAGE_KEY = "yojana-setu-profile-draft";

const readProfileDraft = () => {
    try {
        const savedDraft = sessionStorage.getItem(PROFILE_DRAFT_STORAGE_KEY);
        return savedDraft ? { ...defaultProfileShape, ...JSON.parse(savedDraft) } : defaultProfileShape;
    } catch {
        return defaultProfileShape;
    }
};

function Profile({ onBack, onFindSchemes }) {
    const [profile, setProfile] = useState(readProfileDraft);
    const [voiceText, setVoiceText] = useState("");
    const [voiceError, setVoiceError] = useState("");
    const [isListening, setIsListening] = useState(false);
    const [voiceReview, setVoiceReview] = useState(null);
    const [voiceDraft, setVoiceDraft] = useState(defaultProfileShape);
    const [isEditingVoiceDetails, setIsEditingVoiceDetails] = useState(false);
    const [voiceLanguage, setVoiceLanguage] = useState("en");
    const [openCombobox, setOpenCombobox] = useState("");
    const [stateQuery, setStateQuery] = useState("");
    const [districtQuery, setDistrictQuery] = useState("");
    const [businessQuery, setBusinessQuery] = useState("");
    const [errors, setErrors] = useState({});
    const recognitionRef = useRef(null);
    const pageRef = useRef(null);

    const districts = stateDistricts[profile.state] || [];
    const filteredStates = states.filter((item) => item.toLowerCase().includes(stateQuery.toLowerCase()));
    const filteredDistricts = districts.filter((item) => item.toLowerCase().includes(districtQuery.toLowerCase()));
    const filteredBusinesses = businessSuggestions.filter((item) => item.toLowerCase().includes(businessQuery.toLowerCase()));

    useEffect(() => {
        try {
            sessionStorage.setItem(PROFILE_DRAFT_STORAGE_KEY, JSON.stringify(profile));
        } catch {
        }
    }, [profile]);

    useEffect(() => {
        const onClickOutside = (event) => {
            if (!pageRef.current?.contains(event.target)) {
                setOpenCombobox("");
            }
        };
        const onEscape = (event) => {
            if (event.key === "Escape") setOpenCombobox("");
        };
        document.addEventListener("mousedown", onClickOutside);
        document.addEventListener("keydown", onEscape);
        return () => {
            document.removeEventListener("mousedown", onClickOutside);
            document.removeEventListener("keydown", onEscape);
            recognitionRef.current?.stop();
        };
    }, []);

    useEffect(() => {
        if (profile.state) {
            setStateQuery(profile.state);
        }
        if (!profile.state) {
            setDistrictQuery("");
        }
    }, [profile.state]);

    const updateField = (name, value) => {
        setProfile((current) => ({ ...current, [name]: value }));
        setErrors((current) => ({ ...current, [name]: "" }));
    };

    const handleChange = (event) => {
        const { name, value, type, checked } = event.target;
        updateField(name, type === "checkbox" ? checked : value);
    };

    const handleVoiceFieldChange = (event) => {
        const { name, value, type, checked } = event.target;
        setVoiceDraft((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
    };

    const selectState = (value) => {
        setProfile((current) => ({ ...current, state: value, district: "" }));
        setStateQuery(value);
        setDistrictQuery("");
        setOpenCombobox("");
        setErrors((current) => ({ ...current, state: "", district: "" }));
    };

    const [isDetectingLocation, setIsDetectingLocation] = useState(false);
    const [locationDetectStatus, setLocationDetectStatus] = useState("");

    const selectDistrict = (value) => {
        updateField("district", value);
        setDistrictQuery(value);
        setOpenCombobox("");
    };

    const handleDetectLocation = () => {
        if (!navigator.geolocation) {
            setLocationDetectStatus("Geolocation is not supported by your browser.");
            return;
        }

        setIsDetectingLocation(true);
        setLocationDetectStatus("Detecting your current location...");

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    const res = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
                    );
                    const data = await res.json();
                    const address = data?.address || {};

                    const rawState = address.state || address.state_district || "";
                    const rawDistrict = address.state_district || address.county || address.city || address.district || address.town || "";

                    // Match state
                    let matchedState = states.find(
                        (s) => s.toLowerCase() === rawState.toLowerCase() || rawState.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(rawState.toLowerCase())
                    );
                    if (!matchedState && /delhi/i.test(rawState)) {
                        matchedState = "Delhi";
                    }

                    if (matchedState) {
                        setProfile((prev) => ({ ...prev, state: matchedState }));
                        setStateQuery(matchedState);
                        setErrors((prev) => ({ ...prev, state: "" }));

                        const dists = stateDistricts[matchedState] || [];
                        let matchedDistrict = dists.find(
                            (d) => d.toLowerCase() === rawDistrict.toLowerCase() || rawDistrict.toLowerCase().includes(d.toLowerCase()) || d.toLowerCase().includes(rawDistrict.toLowerCase())
                        );

                        if (matchedDistrict) {
                            setProfile((prev) => ({ ...prev, state: matchedState, district: matchedDistrict }));
                            setDistrictQuery(matchedDistrict);
                            setErrors((prev) => ({ ...prev, district: "" }));
                            setLocationDetectStatus(`Auto-detected: ${matchedDistrict}, ${matchedState}`);
                        } else {
                            setLocationDetectStatus(`Auto-detected State: ${matchedState}. Please select your district.`);
                        }
                    } else {
                        setLocationDetectStatus("Could not auto-match your state. Please select from the dropdown.");
                    }
                } catch {
                    setLocationDetectStatus("Unable to resolve address from coordinates. Please select manually.");
                } finally {
                    setIsDetectingLocation(false);
                }
            },
            (error) => {
                setIsDetectingLocation(false);
                if (error.code === error.PERMISSION_DENIED) {
                    setLocationDetectStatus("Location permission was denied. Please select your State & District manually.");
                } else {
                    setLocationDetectStatus("Unable to retrieve location. Please select manually.");
                }
            },
            { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
        );
    };

    const handleVoiceStart = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            setVoiceError("Voice input is not supported by your current browser. Please use Google Chrome or type your details manually.");
            return;
        }

        if (recognitionRef.current) {
            recognitionRef.current.stop();
            return;
        }

        setVoiceError("");
        const recognition = new SpeechRecognition();
        recognition.lang = getRecognitionLanguage(voiceLanguage);
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            setIsListening(true);
            setVoiceText("");
            setVoiceReview(null);
            setIsEditingVoiceDetails(false);
        };

        recognition.onresult = (event) => {
            const transcript = Array.from(event.results)
                .map((result) => result[0]?.transcript || "")
                .join(" ")
                .trim();

            if (!transcript) return;

            setVoiceText(transcript);
            const parsed = extractProfileFromVoiceText(transcript);
            setVoiceDraft((current) => ({ ...defaultProfileShape, ...current, ...parsed.profile }));
            setVoiceReview(parsed);
            setVoiceError("");
        };

        recognition.onerror = (event) => {
            const nextError = {
                "no-speech": "No speech detected. Please speak clearly into your microphone.",
                "not-allowed": "Microphone permission was denied. Please allow microphone access in your browser settings.",
                "service-not-allowed": "Microphone permission is required.",
                "audio-capture": "No microphone found on this device.",
                network: "Voice recognition service unreachable.",
                aborted: "Voice input stopped.",
            }[event.error] || "Could not process audio. Please try again or complete the form below.";

            setVoiceError(nextError);
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
            recognitionRef.current = null;
        };

        recognitionRef.current = recognition;
        recognition.start();
    };

    const applyVoiceDraft = () => {
        const nextProfile = {
            ...defaultProfileShape,
            ...voiceDraft,
            turnover: voiceDraft.turnover ? String(voiceDraft.turnover).replace(/\D/g, "") : "",
            loanAmount: voiceDraft.loanAmount ? String(voiceDraft.loanAmount).replace(/\D/g, "") : "",
        };

        setProfile(nextProfile);
        setStateQuery(nextProfile.state || "");
        setDistrictQuery(nextProfile.district || "");
        onFindSchemes(nextProfile);
    };

    const validate = () => {
        const nextErrors = {};
        if (!profile.applicantType) nextErrors.applicantType = "Please select an applicant category.";
        if (!profile.businessType || !profile.businessType.trim()) nextErrors.businessType = "Please enter your business type.";
        if (!profile.businessStatus) nextErrors.businessStatus = "Please select your business status.";
        if (!profile.state) nextErrors.state = "Please select your state.";
        if (!profile.district) nextErrors.district = "Please select your district.";
        if (!profile.loanAmount) nextErrors.loanAmount = "Enter the loan amount you need.";
        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        if (!validate()) {
            const firstErrorField = document.querySelector(".ys-field-error");
            firstErrorField?.scrollIntoView({ behavior: "smooth", block: "center" });
            return;
        }
        console.log("Entrepreneur Profile:", profile);
        onFindSchemes(profile);
    };

    const voiceSummary = voiceReview?.summary || [];
    const voiceWarnings = voiceReview?.warnings || [];

    return (
        <div className="ys-profile-page" ref={pageRef}>
            <style>{`
                .ys-profile-page {
                    min-height: 100vh;
                    background-color: #f8fafc;
                    color: #0f172a;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                    padding: 28px 20px 80px;
                    -webkit-font-smoothing: antialiased;
                }

                .ys-container {
                    max-width: 860px;
                    margin: 0 auto;
                }

                /* Top Navigation */
                .ys-topbar {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 24px;
                }

                .ys-back-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    background: #ffffff;
                    border: 1px solid #d1d5db;
                    color: #374151;
                    border-radius: 8px;
                    padding: 8px 16px;
                    font-size: 13.5px;
                    font-weight: 600;
                    cursor: pointer;
                    text-decoration: none;
                    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
                    transition: all 0.15s ease;
                }

                .ys-back-btn:hover {
                    background: #f9fafb;
                    border-color: #9ca3af;
                }

                .ys-back-btn:focus-visible {
                    outline: 2px solid #ea580c;
                    outline-offset: 2px;
                }

                .ys-service-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 12px;
                    font-weight: 600;
                    color: #475569;
                    background: #ffffff;
                    border: 1px solid #e2e8f0;
                    padding: 5px 12px;
                    border-radius: 6px;
                }

                .ys-service-dot {
                    width: 7px;
                    height: 7px;
                    border-radius: 50%;
                    background-color: #ea580c;
                }

                /* Header Card */
                .ys-header {
                    background: #ffffff;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    padding: 30px 34px;
                    margin-bottom: 24px;
                    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
                }

                .ys-header h1 {
                    margin: 0 0 8px;
                    font-size: 1.75rem;
                    font-weight: 800;
                    color: #0f172a;
                    letter-spacing: -0.02em;
                }

                .ys-header p {
                    margin: 0 0 24px;
                    font-size: 14.5px;
                    line-height: 1.6;
                    color: #475569;
                    max-width: 680px;
                }

                /* Progress Indicator */
                .ys-progress-bar {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding-top: 18px;
                    border-top: 1px solid #f1f5f9;
                    overflow-x: auto;
                    scrollbar-width: none;
                }

                .ys-progress-bar::-webkit-scrollbar {
                    display: none;
                }

                .ys-progress-step {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 13px;
                    font-weight: 600;
                    color: #475569;
                    white-space: nowrap;
                }

                .ys-progress-num {
                    font-size: 11.5px;
                    font-weight: 700;
                    color: #ea580c;
                    background: #fff7ed;
                    border: 1px solid #fed7aa;
                    border-radius: 4px;
                    padding: 2px 6px;
                }

                .ys-progress-divider {
                    color: #cbd5e1;
                    font-size: 12px;
                }

                /* Voice Assistance ("Bolkar Khoje") */
                .ys-voice-panel {
                    background: #ffffff;
                    border: 1px solid #e2e8f0;
                    border-left: 4px solid #ea580c;
                    border-radius: 10px;
                    padding: 22px 26px;
                    margin-bottom: 24px;
                    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
                }

                .ys-voice-top {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    flex-wrap: wrap;
                    gap: 16px;
                }

                .ys-voice-text h2 {
                    margin: 0;
                    font-size: 1.1rem;
                    font-weight: 700;
                    color: #0f172a;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .ys-voice-text p {
                    margin: 4px 0 0;
                    font-size: 13.5px;
                    color: #64748b;
                }

                .ys-voice-actions {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .ys-voice-select {
                    height: 40px;
                    padding: 0 12px;
                    border: 1px solid #cbd5e1;
                    border-radius: 8px;
                    background: #ffffff;
                    color: #334155;
                    font-size: 13px;
                    font-weight: 500;
                    outline: none;
                }

                .ys-voice-select:focus {
                    border-color: #ea580c;
                    box-shadow: 0 0 0 3px rgba(234, 88, 12, 0.15);
                }

                .ys-voice-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 7px;
                    height: 40px;
                    padding: 0 18px;
                    border-radius: 8px;
                    border: 1px solid #ea580c;
                    background: #ea580c;
                    color: #ffffff;
                    font-size: 13.5px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.15s ease;
                }

                .ys-voice-btn:hover {
                    background: #c2410c;
                    border-color: #c2410c;
                }

                .ys-voice-btn.listening {
                    background: #dc2626;
                    border-color: #dc2626;
                }

                .ys-voice-hint {
                    margin-top: 14px;
                    font-size: 12.5px;
                    color: #64748b;
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 6px;
                    padding: 9px 14px;
                }

                .ys-voice-output {
                    margin-top: 12px;
                    padding: 12px 16px;
                    background: #f0fdf4;
                    border: 1px solid #bbf7d0;
                    border-radius: 8px;
                    font-size: 13.5px;
                    color: #166534;
                    line-height: 1.5;
                }

                .ys-voice-error-box {
                    margin-top: 12px;
                    padding: 12px 16px;
                    background: #fef2f2;
                    border: 1px solid #fecaca;
                    border-radius: 8px;
                    font-size: 13px;
                    color: #991b1b;
                }

                .ys-voice-review {
                    margin-top: 16px;
                    padding: 16px;
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                }

                .ys-voice-review-title {
                    font-size: 13px;
                    font-weight: 700;
                    color: #334155;
                    margin-bottom: 10px;
                }

                .ys-voice-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                    gap: 10px;
                }

                .ys-voice-grid-item {
                    background: #ffffff;
                    border: 1px solid #e2e8f0;
                    border-radius: 6px;
                    padding: 10px 12px;
                }

                .ys-voice-grid-item span {
                    display: block;
                    font-size: 11px;
                    color: #64748b;
                    font-weight: 600;
                    text-transform: uppercase;
                }

                .ys-voice-grid-item strong {
                    display: block;
                    font-size: 13.5px;
                    color: #0f172a;
                    margin-top: 2px;
                }

                .ys-voice-btn-group {
                    display: flex;
                    gap: 10px;
                    margin-top: 14px;
                }

                .ys-voice-btn-primary {
                    height: 36px;
                    padding: 0 16px;
                    border-radius: 6px;
                    background: #ea580c;
                    border: 0;
                    color: #ffffff;
                    font-size: 13px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: background 0.15s;
                }

                .ys-voice-btn-primary:hover {
                    background: #c2410c;
                }

                .ys-voice-btn-secondary {
                    height: 36px;
                    padding: 0 16px;
                    border-radius: 6px;
                    background: #ffffff;
                    border: 1px solid #cbd5e1;
                    color: #334155;
                    font-size: 13px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: background 0.15s;
                }

                .ys-voice-btn-secondary:hover {
                    background: #f1f5f9;
                }

                /* Form Master Card */
                .ys-form-card {
                    background: #ffffff;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    padding: 34px 38px;
                    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
                }

                /* Numbered Form Sections */
                .ys-section {
                    margin-bottom: 34px;
                    padding-bottom: 30px;
                    border-bottom: 1px solid #f1f5f9;
                }

                .ys-section:last-of-type {
                    border-bottom: none;
                    margin-bottom: 16px;
                    padding-bottom: 0;
                }

                .ys-section-header {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 20px;
                }

                .ys-section-num {
                    font-size: 11px;
                    font-weight: 800;
                    color: #475569;
                    background: #f1f5f9;
                    border-radius: 4px;
                    padding: 3px 8px;
                    letter-spacing: 0.06em;
                    text-transform: uppercase;
                }

                .ys-section-header h2 {
                    margin: 0;
                    font-size: 1.05rem;
                    font-weight: 700;
                    color: #0f172a;
                    letter-spacing: -0.01em;
                }

                .ys-section-hint {
                    margin: -10px 0 18px 0;
                    font-size: 13px;
                    color: #64748b;
                }

                /* Layout Grids */
                .ys-grid-2 {
                    display: grid;
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                    gap: 20px;
                }

                .ys-grid-1 {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 20px;
                }

                /* Form Controls */
                .ys-field {
                    display: flex;
                    flex-direction: column;
                    gap: 7px;
                }

                .ys-label {
                    font-size: 13.5px;
                    font-weight: 600;
                    color: #1e293b;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }

                .ys-required {
                    color: #dc2626;
                    font-weight: 700;
                }

                .ys-helper {
                    font-size: 12px;
                    color: #64748b;
                    margin-top: 2px;
                    line-height: 1.4;
                }

                .ys-input,
                .ys-select {
                    width: 100%;
                    height: 48px;
                    padding: 0 14px;
                    border: 1px solid #cbd5e1;
                    border-radius: 8px;
                    background: #ffffff;
                    color: #0f172a;
                    font-size: 14px;
                    font-family: inherit;
                    box-sizing: border-box;
                    transition: border-color 0.15s, box-shadow 0.15s;
                }

                .ys-input::placeholder {
                    color: #94a3b8;
                }

                .ys-input:focus,
                .ys-select:focus {
                    outline: none;
                    border-color: #ea580c;
                    box-shadow: 0 0 0 3px rgba(234, 88, 12, 0.15);
                }

                .ys-input.error,
                .ys-select.error {
                    border-color: #dc2626;
                    background-color: #fffafa;
                }

                .ys-input.error:focus,
                .ys-select.error:focus {
                    box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.15);
                }

                .ys-field-error {
                    font-size: 12px;
                    color: #dc2626;
                    font-weight: 500;
                    margin: 3px 0 0;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }

                /* Combobox Dropdowns */
                .ys-combobox-wrap {
                    position: relative;
                }

                .ys-combobox-input {
                    padding-right: 38px !important;
                    cursor: pointer;
                }

                .ys-combobox-arrow {
                    position: absolute;
                    right: 13px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #64748b;
                    pointer-events: none;
                    display: grid;
                    place-items: center;
                    transition: transform 0.15s ease;
                }

                .ys-combobox-arrow.open {
                    transform: translateY(-50%) rotate(180deg);
                    color: #ea580c;
                }

                .ys-combobox-menu {
                    position: absolute;
                    top: calc(100% + 6px);
                    left: 0;
                    right: 0;
                    max-height: 240px;
                    overflow-y: auto;
                    background: #ffffff;
                    border: 1px solid #cbd5e1;
                    border-radius: 8px;
                    box-shadow: 0 10px 20px -3px rgba(15, 23, 42, 0.1);
                    z-index: 50;
                    padding: 5px;
                }

                .ys-combobox-menu::-webkit-scrollbar {
                    width: 6px;
                }

                .ys-combobox-menu::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 4px;
                }

                .ys-combobox-item {
                    width: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 10px 12px;
                    border: 0;
                    border-radius: 6px;
                    background: transparent;
                    color: #334155;
                    font-size: 13.5px;
                    text-align: left;
                    cursor: pointer;
                    transition: background 0.1s, color 0.1s;
                }

                .ys-combobox-item:hover,
                .ys-combobox-item:focus-visible {
                    background: #fff7ed;
                    color: #c2410c;
                    font-weight: 600;
                    outline: none;
                }

                .ys-combobox-item.selected {
                    background: #fff7ed;
                    color: #ea580c;
                    font-weight: 700;
                }

                .ys-combobox-empty {
                    padding: 14px;
                    text-align: center;
                    color: #94a3b8;
                    font-size: 13px;
                }

                .ys-disabled {
                    background: #f8fafc !important;
                    color: #94a3b8 !important;
                    cursor: not-allowed !important;
                    border-color: #e2e8f0 !important;
                }

                /* Quick Suggestions */
                .ys-suggestions {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 6px;
                    margin-top: 8px;
                }

                .ys-suggestion-btn {
                    border: 1px solid #e2e8f0;
                    background: #f8fafc;
                    color: #475569;
                    border-radius: 6px;
                    padding: 4px 10px;
                    font-size: 12px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.15s ease;
                }

                .ys-suggestion-btn:hover,
                .ys-suggestion-btn:focus-visible {
                    background: #fff7ed;
                    border-color: #fed7aa;
                    color: #ea580c;
                    outline: none;
                }

                /* Additional Information Checkboxes */
                .ys-chips-grid {
                    display: grid;
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                    gap: 14px;
                }

                .ys-chip {
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                    padding: 16px 18px;
                    border: 1.5px solid #e2e8f0;
                    border-radius: 8px;
                    background: #ffffff;
                    cursor: pointer;
                    transition: border-color 0.15s, background 0.15s;
                    user-select: none;
                }

                .ys-chip:hover {
                    border-color: #cbd5e1;
                    background: #f9fafb;
                }

                .ys-chip.selected {
                    border-color: #ea580c;
                    background: #fffaf5;
                }

                .ys-chip-input {
                    margin-top: 3px;
                    width: 17px;
                    height: 17px;
                    accent-color: #ea580c;
                    cursor: pointer;
                }

                .ys-chip-body {
                    flex: 1;
                }

                .ys-chip-title {
                    display: block;
                    font-size: 14px;
                    font-weight: 600;
                    color: #1e293b;
                }

                .ys-chip-desc {
                    display: block;
                    font-size: 12px;
                    color: #64748b;
                    margin-top: 3px;
                    line-height: 1.45;
                }

                /* Submit Section */
                .ys-footer {
                    margin-top: 36px;
                    padding-top: 28px;
                    border-top: 1px solid #f1f5f9;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 14px;
                }

                .ys-cta-btn {
                    width: 100%;
                    max-width: 460px;
                    height: 50px;
                    border: 0;
                    border-radius: 8px;
                    background: #ea580c;
                    color: #ffffff;
                    font-size: 15.5px;
                    font-weight: 700;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    box-shadow: 0 2px 4px rgba(234, 88, 12, 0.2);
                    transition: background 0.15s, box-shadow 0.15s;
                }

                .ys-cta-btn:hover {
                    background: #c2410c;
                    box-shadow: 0 4px 10px rgba(234, 88, 12, 0.28);
                }

                .ys-cta-btn:focus-visible {
                    outline: 2px solid #ea580c;
                    outline-offset: 2px;
                }

                .ys-cta-btn:active {
                    background: #9a3412;
                    transform: translateY(1px);
                }

                .ys-trust-tag {
                    font-size: 12.5px;
                    color: #64748b;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }

                /* Mobile Responsiveness */
                @media (max-width: 768px) {
                    .ys-profile-page {
                        padding: 20px 14px 64px;
                    }

                    .ys-header {
                        padding: 24px 20px;
                    }

                    .ys-header h1 {
                        font-size: 1.5rem;
                    }

                    .ys-form-card {
                        padding: 24px 18px;
                    }

                    .ys-grid-2,
                    .ys-chips-grid {
                        grid-template-columns: 1fr;
                        gap: 18px;
                    }

                    .ys-voice-top {
                        flex-direction: column;
                        align-items: flex-start;
                    }

                    .ys-voice-actions {
                        width: 100%;
                    }

                    .ys-voice-btn {
                        flex: 1;
                        justify-content: center;
                    }

                    .ys-cta-btn {
                        max-width: 100%;
                    }
                }
            `}</style>

            <div className="ys-container">
                {/* Top Navigation */}
                <div className="ys-topbar">
                    <button type="button" className="ys-back-btn" onClick={onBack} aria-label="Return to previous screen">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                        Back
                    </button>
                    <div className="ys-service-badge">
                        <span className="ys-service-dot"></span>
                        Yojana Setu Scheme Discovery
                    </div>
                </div>

                {/* Page Header */}
                <header className="ys-header">
                    <h1>Find Schemes That May Fit Your Business</h1>
                    <p>
                        Tell us a little about your business. We'll show schemes that may match your profile.
                    </p>

                    {/* Progress Indicator */}
                    <div className="ys-progress-bar" aria-label="Sections progress">
                        <div className="ys-progress-step">
                            <span className="ys-progress-num">01</span>
                            <span>Business</span>
                        </div>
                        <span className="ys-progress-divider">→</span>
                        <div className="ys-progress-step">
                            <span className="ys-progress-num">02</span>
                            <span>Location</span>
                        </div>
                        <span className="ys-progress-divider">→</span>
                        <div className="ys-progress-step">
                            <span className="ys-progress-num">03</span>
                            <span>Funding</span>
                        </div>
                        <span className="ys-progress-divider">→</span>
                        <div className="ys-progress-step">
                            <span className="ys-progress-num">04</span>
                            <span>Additional Information</span>
                        </div>
                    </div>
                </header>

                {/* Voice Input Section ("Prefer speaking?") */}
                <section className="ys-voice-panel" aria-label="Voice Profile Assistant">
                    <div className="ys-voice-top">
                        <div className="ys-voice-text">
                            <h2>
                                Prefer speaking?
                            </h2>
                            <p>Tell us about your business in your own words.</p>
                        </div>

                        <div className="ys-voice-actions">
                            <select
                                className="ys-voice-select"
                                value={voiceLanguage}
                                onChange={(event) => setVoiceLanguage(event.target.value)}
                                aria-label="Select voice language"
                            >
                                <option value="en">English (India)</option>
                                <option value="hi">हिन्दी (Hindi)</option>
                                <option value="te">తెలుగు (Telugu)</option>
                                <option value="ta">தமிழ் (Tamil)</option>
                            </select>

                            <button
                                type="button"
                                className={`ys-voice-btn ${isListening ? "listening" : ""}`}
                                onClick={handleVoiceStart}
                                aria-label={isListening ? "Stop listening" : "Start speaking"}
                            >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /></svg>
                                {isListening ? "Listening..." : "🎙 Bolkar Khoje"}
                            </button>
                        </div>
                    </div>

                    <div className="ys-voice-hint">
                        <strong>Example:</strong> “I run a textile business in Warangal. I need a loan of 5 lakh rupees and I am a woman entrepreneur.”
                    </div>

                    {voiceText ? (
                        <div className="ys-voice-output">
                            <strong>Captured speech:</strong> “{voiceText}”
                        </div>
                    ) : null}

                    {voiceError ? (
                        <div className="ys-voice-error-box" role="alert">
                            {voiceError}
                        </div>
                    ) : null}

                    {voiceReview ? (
                        <div className="ys-voice-review">
                            <div className="ys-voice-review-title">Recognized Details</div>
                            <div className="ys-voice-grid">
                                {voiceSummary.map((item) => (
                                    <div className="ys-voice-grid-item" key={item.key}>
                                        <span>{item.label}</span>
                                        <strong>{item.value}</strong>
                                    </div>
                                ))}
                            </div>

                            {voiceWarnings.length > 0 ? (
                                <p style={{ color: "#dc2626", fontSize: "12.5px", marginTop: "8px" }}>
                                    {voiceWarnings.join(" ")}
                                </p>
                            ) : null}

                            {isEditingVoiceDetails ? (
                                <div className="ys-grid-2" style={{ marginTop: 12 }}>
                                    <div className="ys-field">
                                        <label className="ys-label">Business Type</label>
                                        <input className="ys-input" name="businessType" value={voiceDraft.businessType || ""} onChange={handleVoiceFieldChange} placeholder="e.g. Tailoring" />
                                    </div>
                                    <div className="ys-field">
                                        <label className="ys-label">Business Status</label>
                                        <select className="ys-select" name="businessStatus" value={voiceDraft.businessStatus || ""} onChange={handleVoiceFieldChange}>
                                            <option value="">Select</option>
                                            <option value="new">New Business</option>
                                            <option value="existing">Existing Business</option>
                                        </select>
                                    </div>
                                    <div className="ys-field">
                                        <label className="ys-label">State</label>
                                        <input className="ys-input" name="state" value={voiceDraft.state || ""} onChange={handleVoiceFieldChange} placeholder="Telangana" />
                                    </div>
                                    <div className="ys-field">
                                        <label className="ys-label">Loan Required</label>
                                        <input className="ys-input" name="loanAmount" value={voiceDraft.loanAmount || ""} onChange={handleVoiceFieldChange} placeholder="1000000" />
                                    </div>
                                </div>
                            ) : null}

                            <div className="ys-voice-btn-group">
                                <button type="button" className="ys-voice-btn-secondary" onClick={() => setIsEditingVoiceDetails((current) => !current)}>
                                    {isEditingVoiceDetails ? "Close Editor" : "Edit Parsed Fields"}
                                </button>
                                <button type="button" className="ys-voice-btn-primary" onClick={applyVoiceDraft}>
                                    Apply &amp; Find Schemes →
                                </button>
                            </div>
                        </div>
                    ) : null}
                </section>

                {/* Form Master Card */}
                <main className="ys-form-card">
                    <form onSubmit={handleSubmit} noValidate>
                        {/* Section 1: Business Information */}
                        <section className="ys-section">
                            <div className="ys-section-header">
                                <span className="ys-section-num">01</span>
                                <h2>About Your Business</h2>
                            </div>
                            <div className="ys-field">
                                <label className="ys-label" htmlFor="age">
                                    Age <span className="ys-required">*</span>
                                </label>

                                <input
                                    id="age"
                                    name="age"
                                    type="number"
                                    min="18"
                                    max="100"
                                    className={`ys-input ${errors.age ? "error" : ""}`}
                                    value={profile.age || ""}
                                    onChange={handleChange}
                                    placeholder="Enter your age"
                                />

                                {errors.age && (
                                    <p className="ys-field-error">{errors.age}</p>
                                )}
                            </div>

                            <div className="ys-grid-1" style={{ marginBottom: 20 }}>
                                <div className="ys-field">
                                    <label className="ys-label" htmlFor="applicantType">
                                        Applicant Type <span className="ys-required">*</span>
                                    </label>
                                    <select
                                        id="applicantType"
                                        name="applicantType"
                                        className={`ys-select ${errors.applicantType ? "error" : ""}`}
                                        value={profile.applicantType}
                                        onChange={handleChange}
                                    >
                                        <option value="">Select applicant category</option>
                                        <option value="entrepreneur">Entrepreneur / Small Business Owner</option>
                                        <option value="artisan">Artisan / Traditional Craftsperson</option>
                                        <option value="street-vendor">Street Vendor / Hawkers</option>
                                        <option value="msme">MSME Enterprise</option>
                                        <option value="shg">Self-Help Group (SHG) Member</option>
                                    </select>
                                    {errors.applicantType ? <p className="ys-field-error">{errors.applicantType}</p> : null}
                                </div>
                            </div>

                            <div className="ys-grid-2">
                                <div className="ys-field">
                                    <label className="ys-label" htmlFor="businessType">
                                        Business Type <span className="ys-required">*</span>
                                    </label>
                                    <input
                                        id="businessType"
                                        name="businessType"
                                        className={`ys-input ${errors.businessType ? "error" : ""}`}
                                        value={profile.businessType}
                                        onChange={(event) => {
                                            handleChange(event);
                                            setBusinessQuery(event.target.value);
                                        }}
                                        placeholder="e.g. Textile, Food Processing, Dairy"
                                        autoComplete="off"
                                    />
                                    {businessQuery && filteredBusinesses.length > 0 ? (
                                        <div className="ys-suggestions">
                                            {filteredBusinesses.map((item) => (
                                                <button
                                                    type="button"
                                                    className="ys-suggestion-btn"
                                                    key={item}
                                                    onClick={() => {
                                                        updateField("businessType", item);
                                                        setBusinessQuery("");
                                                    }}
                                                >
                                                    + {item}
                                                </button>
                                            ))}
                                        </div>
                                    ) : null}
                                    {errors.businessType ? <p className="ys-field-error">{errors.businessType}</p> : null}
                                </div>

                                <div className="ys-field">
                                    <label className="ys-label" htmlFor="businessStatus">
                                        Business Status <span className="ys-required">*</span>
                                    </label>
                                    <select
                                        id="businessStatus"
                                        name="businessStatus"
                                        className={`ys-select ${errors.businessStatus ? "error" : ""}`}
                                        value={profile.businessStatus}
                                        onChange={handleChange}
                                    >
                                        <option value="">Select current stage</option>
                                        <option value="new">New Business (Starting Up)</option>
                                        <option value="existing">Existing Business (Expansion / Working Capital)</option>
                                    </select>
                                    {errors.businessStatus ? <p className="ys-field-error">{errors.businessStatus}</p> : null}
                                </div>
                            </div>
                        </section>

                        {/* Section 2: Location */}
                        <section className="ys-section">
                            <div className="ys-section-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <span className="ys-section-num">02</span>
                                    <h2>Where Is Your Business Located?</h2>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleDetectLocation}
                                    disabled={isDetectingLocation}
                                    className="ys-btn-ghost ys-btn-sm"
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "6px",
                                        fontSize: "13px",
                                        fontWeight: "600",
                                        padding: "6px 12px",
                                        borderRadius: "8px",
                                        border: "1px solid #cbd5e1",
                                        background: "#f8fafc",
                                        color: "#0f172a",
                                        cursor: isDetectingLocation ? "wait" : "pointer",
                                    }}
                                >
                                    <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "#005AC1" }}>
                                        {isDetectingLocation ? "sync" : "my_location"}
                                    </span>
                                    <span>{isDetectingLocation ? "Detecting..." : "Use My Location"}</span>
                                </button>
                            </div>
                            {locationDetectStatus ? (
                                <p style={{ fontSize: "13px", color: locationDetectStatus.startsWith("Unable") || locationDetectStatus.includes("denied") || locationDetectStatus.includes("Could not") ? "#b91c1c" : "#047857", margin: "-6px 0 14px 0", fontWeight: "600" }}>
                                    {locationDetectStatus}
                                </p>
                            ) : (
                                <p className="ys-section-hint">Start typing to search or use auto-detection. Select a district from the list.</p>
                            )}

                            <div className="ys-grid-2">
                                {/* State Searchable Combobox */}
                                <div className="ys-field">
                                    <label className="ys-label" htmlFor="stateQuery">
                                        State <span className="ys-required">*</span>
                                    </label>
                                    <div className="ys-combobox-wrap">
                                        <input
                                            id="stateQuery"
                                            className={`ys-input ys-combobox-input ${errors.state ? "error" : ""}`}
                                            value={stateQuery}
                                            placeholder="Type or select state..."
                                            onFocus={() => setOpenCombobox("state")}
                                            onChange={(event) => {
                                                setStateQuery(event.target.value);
                                                setOpenCombobox("state");
                                            }}
                                            autoComplete="off"
                                            role="combobox"
                                            aria-expanded={openCombobox === "state"}
                                            aria-autocomplete="list"
                                        />
                                        <span className={`ys-combobox-arrow ${openCombobox === "state" ? "open" : ""}`}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>
                                        </span>

                                        {openCombobox === "state" ? (
                                            <div className="ys-combobox-menu" role="listbox">
                                                {filteredStates.length > 0 ? (
                                                    filteredStates.map((item) => (
                                                        <button
                                                            type="button"
                                                            className={`ys-combobox-item ${item === profile.state ? "selected" : ""}`}
                                                            key={item}
                                                            onClick={() => selectState(item)}
                                                            role="option"
                                                            aria-selected={item === profile.state}
                                                        >
                                                            <span>{item}</span>
                                                            {item === profile.state ? (
                                                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                                                            ) : null}
                                                        </button>
                                                    ))
                                                ) : (
                                                    <div className="ys-combobox-empty">No states found</div>
                                                )}
                                            </div>
                                        ) : null}
                                    </div>
                                    {errors.state ? <p className="ys-field-error">{errors.state}</p> : null}
                                </div>

                                {/* District Searchable Combobox */}
                                <div className="ys-field">
                                    <label className="ys-label" htmlFor="districtQuery">
                                        District <span className="ys-required">*</span>
                                    </label>
                                    <div className="ys-combobox-wrap">
                                        <input
                                            id="districtQuery"
                                            className={`ys-input ys-combobox-input ${!profile.state ? "ys-disabled" : ""} ${errors.district ? "error" : ""}`}
                                            value={districtQuery}
                                            disabled={!profile.state}
                                            placeholder={profile.state ? "Type or select district..." : "Select a state first"}
                                            onFocus={() => profile.state && setOpenCombobox("district")}
                                            onChange={(event) => {
                                                setDistrictQuery(event.target.value);
                                                setOpenCombobox("district");
                                            }}
                                            autoComplete="off"
                                            role="combobox"
                                            aria-expanded={openCombobox === "district"}
                                            aria-autocomplete="list"
                                        />
                                        <span className={`ys-combobox-arrow ${openCombobox === "district" ? "open" : ""}`}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>
                                        </span>

                                        {openCombobox === "district" && profile.state ? (
                                            <div className="ys-combobox-menu" role="listbox">
                                                {filteredDistricts.length > 0 ? (
                                                    filteredDistricts.map((item) => (
                                                        <button
                                                            type="button"
                                                            className={`ys-combobox-item ${item === profile.district ? "selected" : ""}`}
                                                            key={item}
                                                            onClick={() => selectDistrict(item)}
                                                            role="option"
                                                            aria-selected={item === profile.district}
                                                        >
                                                            <span>{item}</span>
                                                            {item === profile.district ? (
                                                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                                                            ) : null}
                                                        </button>
                                                    ))
                                                ) : (
                                                    <div className="ys-combobox-empty">No districts found</div>
                                                )}
                                            </div>
                                        ) : null}
                                    </div>
                                    {errors.district ? <p className="ys-field-error">{errors.district}</p> : null}
                                </div>
                            </div>
                        </section>

                        {/* Section 3: Funding Requirement */}
                        <section className="ys-section">
                            <div className="ys-section-header">
                                <span className="ys-section-num">03</span>
                                <h2>Funding Requirement</h2>
                            </div>

                            <div className="ys-grid-2">
                                <div className="ys-field">
                                    <label className="ys-label" htmlFor="turnover">
                                        Annual Turnover
                                    </label>
                                    <input
                                        id="turnover"
                                        name="turnover"
                                        className="ys-input"
                                        value={profile.turnover ? formatMoneyValue(profile.turnover) : ""}
                                        onChange={(event) => updateField("turnover", event.target.value.replace(/\D/g, ""))}
                                        placeholder="e.g. ₹5,00,000"
                                        autoComplete="off"
                                    />
                                    <span className="ys-helper">Your approximate past 12-month sales revenue. Leave blank if starting new.</span>
                                </div>

                                <div className="ys-field">
                                    <label className="ys-label" htmlFor="loanAmount">
                                        Loan Amount Required <span className="ys-required">*</span>
                                    </label>
                                    <input
                                        id="loanAmount"
                                        name="loanAmount"
                                        className={`ys-input ${errors.loanAmount ? "error" : ""}`}
                                        value={profile.loanAmount ? formatMoneyValue(profile.loanAmount) : ""}
                                        onChange={(event) => updateField("loanAmount", event.target.value.replace(/\D/g, ""))}
                                        placeholder="e.g. ₹10,00,000"
                                        autoComplete="off"
                                    />
                                    <span className="ys-helper">The estimated working capital or term loan needed for your enterprise.</span>
                                    {errors.loanAmount ? <p className="ys-field-error">{errors.loanAmount}</p> : null}
                                </div>
                            </div>
                        </section>

                        {/* Section 4: A Few More Details */}
                        <section className="ys-section">
                            <div className="ys-section-header">
                                <span className="ys-section-num">04</span>
                                <h2>A Few More Details</h2>
                            </div>

                            <div className="ys-chips-grid">
                                {additionalOptions.map(([name, label, iconType, description]) => {
                                    const isSelected = Boolean(profile[name]);
                                    return (
                                        <label key={name} className={`ys-chip ${isSelected ? "selected" : ""}`}>
                                            <input
                                                type="checkbox"
                                                name={name}
                                                checked={isSelected}
                                                onChange={handleChange}
                                                className="ys-chip-input"
                                            />
                                            <div className="ys-chip-body">
                                                <span className="ys-chip-title">{label}</span>
                                                <span className="ys-chip-desc">{description}</span>
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>
                        </section>

                        {/* Submit Action */}
                        <div className="ys-footer">
                            <button type="submit" className="ys-cta-btn">
                                Find My Schemes →
                            </button>
                            <div className="ys-trust-tag">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                                <span>Official Central &amp; State Scheme Rules • Free &amp; Secure</span>
                            </div>
                        </div>
                    </form>
                </main>
            </div>
        </div>
    );
}

export default Profile;