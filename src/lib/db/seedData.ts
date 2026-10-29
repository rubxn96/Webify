export interface SeedTrack {
  youtubeId: string;
  title: string;
  artist: string;
  album: string;
  isrc: string;
  duration: number;
  thumbnail: string;
  lyrics: string;
  embedding: number[]; // 8-dimensional audio feature vector [energy, valence, tempo_norm, acousticness, danceability, instrumentalness, speechiness, liveness]
}

export const SEED_TRACKS: SeedTrack[] = [
  // ==========================================
  // HINDI HITS (BOLLYWOOD & INDIE)
  // ==========================================
  {
    youtubeId: "BddP6PYo2gs", // Kesariya - Brahmāstra
    title: "Kesariya",
    artist: "Arijit Singh, Pritam",
    album: "Brahmāstra",
    isrc: "INS182200591",
    duration: 268,
    thumbnail: "https://i.ytimg.com/vi/BddP6PYo2gs/hqdefault.jpg",
    lyrics: `[00:15.00]Mujhko itna bataaye koyi
[00:18.50]Kaise tujhse dil na lagaaye koyi
[00:23.00]Rabba ne tujhko banaane mein
[00:26.50]Kardi hai husn ki khaali tijoriyaan
[00:31.00]Kaajal ki siyahi se likhi
[00:34.50]Hai tune jaane kitno ki love storiyaan
[00:40.00]Kesariya tera ishq hai piya
[00:44.00]Rang jaaun jo main haath lagaun
[00:48.00]Din beete saara teri fikr mein
[00:52.00]Rain saari teri khair manaun`,
    embedding: [0.62, 0.65, 0.52, 0.42, 0.58, 0.0, 0.04, 0.12],
  },
  {
    youtubeId: "ElZ_1fWqxqg", // Apna Bana Le - Bhediya
    title: "Apna Bana Le",
    artist: "Arijit Singh, Sachin-Jigar",
    album: "Bhediya",
    isrc: "INZ032209401",
    duration: 261,
    thumbnail: "https://i.ytimg.com/vi/ElZ_1fWqxqg/hqdefault.jpg",
    lyrics: `[00:14.00]Tu mera koyi na hoke bhi kuch laage
[00:21.00]Kiya re jo bhi tune kaise kiya re
[00:28.00]Jiya ko mere baandh aise liya re
[00:35.00]Samajh ke bhi na samjhe dil yeh mera
[00:42.00]Apna bana le piya, apna bana le piya
[00:50.00]Dil ke nagar mein shehar tu basa le piya`,
    embedding: [0.55, 0.48, 0.45, 0.52, 0.51, 0.0, 0.03, 0.10],
  },
  {
    youtubeId: "VAdGW7QDJiU", // Chaleya - Jawan
    title: "Chaleya",
    artist: "Arijit Singh, Shilpa Rao, Anirudh",
    album: "Jawan",
    isrc: "INS182302341",
    duration: 200,
    thumbnail: "https://i.ytimg.com/vi/VAdGW7QDJiU/hqdefault.jpg",
    lyrics: `[00:08.00]Ishq mein dil bana hai, ishq mein dil fanaa hai
[00:13.00]Jitna bhi roko dil ko, utna hi yeh khada hai
[00:18.00]Jaane kyun har dafa tu hi dikhta raha
[00:24.00]Teri aankhon mein jaadu aisa chala
[00:29.00]Chaleya teri ore chaleya main
[00:34.00]Tujhmein hi kho gaya chaleya main`,
    embedding: [0.74, 0.82, 0.60, 0.15, 0.72, 0.0, 0.05, 0.11],
  },
  {
    youtubeId: "LK7-_dgAVQE", // Tauba Tauba - Bad Newz
    title: "Tauba Tauba",
    artist: "Karan Aujla",
    album: "Bad Newz",
    isrc: "INS182400981",
    duration: 207,
    thumbnail: "https://i.ytimg.com/vi/LK7-_dgAVQE/hqdefault.jpg",
    lyrics: `[00:05.00]Karan Aujla!
[00:10.00]Husn tera tauba tauba
[00:14.00]O munda maare jhatke ni
[00:17.00]Akhiyan ne billo teri zehar vangran
[00:22.00]Dil utte chalde ne teer wangran
[00:26.00]Tauba tauba re tauba tauba`,
    embedding: [0.89, 0.92, 0.72, 0.08, 0.85, 0.0, 0.18, 0.15],
  },
  {
    youtubeId: "9UmoVnBSm5k", // Pehle Bhi Main - Animal
    title: "Pehle Bhi Main",
    artist: "Vishal Mishra, Raj Shekhar",
    album: "Animal",
    isrc: "INT102302198",
    duration: 250,
    thumbnail: "https://i.ytimg.com/vi/9UmoVnBSm5k/hqdefault.jpg",
    lyrics: `[00:12.00]Pehle bhi main tumse mila hoon
[00:18.00]Pehli dafa hi milke laga
[00:24.00]Tune chhua zakhmon ko mere
[00:30.00]Marham sa kyun lagne laga
[00:37.00]Kyun pehle se janta hoon main tujhe
[00:43.00]Kyun har dafa pehchanta hoon main tujhe`,
    embedding: [0.48, 0.38, 0.42, 0.65, 0.49, 0.0, 0.04, 0.08],
  },
  {
    youtubeId: "HrnrqYxYrbk", // Satranga - Animal
    title: "Satranga",
    artist: "Arijit Singh, Shreyas Puranik",
    album: "Animal",
    isrc: "INT102302204",
    duration: 271,
    thumbnail: "https://i.ytimg.com/vi/HrnrqYxYrbk/hqdefault.jpg",
    lyrics: `[00:10.00]Aadha ishq aadha hai aadha ho jaayega
[00:16.00]Kadhmon ko tham zara rasta mil jaayega
[00:23.00]Satranga banna tha main tere ishq mein
[00:30.00]Kore kaagaz sa reh gaya tere ishq mein`,
    embedding: [0.52, 0.41, 0.46, 0.58, 0.44, 0.0, 0.03, 0.09],
  },
  {
    youtubeId: "n_W5I0q0C18", // O Maahi - Dunki
    title: "O Maahi",
    artist: "Arijit Singh, Pritam",
    album: "Dunki",
    isrc: "INT102302381",
    duration: 233,
    thumbnail: "https://i.ytimg.com/vi/n_W5I0q0C18/hqdefault.jpg",
    lyrics: `[00:10.00]O maahi o maahi
[00:16.00]Tera ban jaaun jo tu dede ijazat
[00:23.00]O maahi o maahi
[00:29.00]Meri har saans pe tera hi naam likha hai`,
    embedding: [0.60, 0.59, 0.50, 0.45, 0.54, 0.0, 0.04, 0.10],
  },
  {
    youtubeId: "AX6OrbgS8lI", // Tu Hai Kahan - AUR
    title: "Tu Hai Kahan",
    artist: "AUR (Ahad, Usama, Raffey)",
    album: "Tu Hai Kahan",
    isrc: "PKB012300012",
    duration: 263,
    thumbnail: "https://i.ytimg.com/vi/AX6OrbgS8lI/hqdefault.jpg",
    lyrics: `[00:15.00]Socha na tha zindagi mein aisa mod aayega
[00:22.00]Jaane kab yeh dil tujhko dhoondhta reh jaayega
[00:30.00]Tu hai kahan meri jaan
[00:36.00]Tere bina soona hai saara aasmaan`,
    embedding: [0.51, 0.44, 0.40, 0.60, 0.58, 0.0, 0.06, 0.09],
  },
  {
    youtubeId: "gJLVTKhTnog", // Husn - Anuv Jain
    title: "Husn",
    artist: "Anuv Jain",
    album: "Husn",
    isrc: "INA012300452",
    duration: 218,
    thumbnail: "https://i.ytimg.com/vi/gJLVTKhTnog/hqdefault.jpg",
    lyrics: `[00:12.00]Dekho dekho kaisi baatein yahan ki
[00:18.00]Hai saath par hain saath na bhi
[00:24.00]Kya itni si thi meri yeh kahaani
[00:30.00]Husn tera taaron jaisa chhamke
[00:36.00]Par dil yeh mera rota hi rahe`,
    embedding: [0.38, 0.32, 0.38, 0.78, 0.48, 0.0, 0.04, 0.07],
  },
  {
    youtubeId: "X7WXHhokylc", // Tere Vaaste - Zara Hatke Zara Bachke
    title: "Tere Vaaste",
    artist: "Varun Jain, Sachin-Jigar, Shadab Faridi",
    album: "Zara Hatke Zara Bachke",
    isrc: "INZ032301821",
    duration: 189,
    thumbnail: "https://i.ytimg.com/vi/X7WXHhokylc/hqdefault.jpg",
    lyrics: `[00:08.00]Tere vaaste falak se main chaand laaunga
[00:14.00]Solah satrah sitaare sang baandh laaunga
[00:20.00]Chanda ko todke main tere maathe pe lagaaunga`,
    embedding: [0.72, 0.78, 0.58, 0.28, 0.74, 0.0, 0.05, 0.12],
  },
  {
    youtubeId: "VFcsgi5UtQM", // Tum Hi Ho - Aashiqui 2
    title: "Tum Hi Ho",
    artist: "Arijit Singh, Mithoon",
    album: "Aashiqui 2",
    isrc: "INT101300291",
    duration: 262,
    thumbnail: "https://i.ytimg.com/vi/VFcsgi5UtQM/hqdefault.jpg",
    lyrics: `[00:25.00]Hum tere bin ab reh nahi sakte
[00:30.00]Tere bina kya wajood mera
[00:36.00]Tujhse juda agar ho jaayenge
[00:41.00]Toh khud se hi ho jaayenge judaa
[00:48.00]Kyunki tum hi ho, ab tum hi ho
[00:54.00]Zindagi ab tum hi ho`,
    embedding: [0.54, 0.36, 0.44, 0.48, 0.45, 0.0, 0.03, 0.10],
  },
  {
    youtubeId: "gvyUuxdRdR4", // Raataan Lambiyan - Shershaah
    title: "Raataan Lambiyan",
    artist: "Jubin Nautiyal, Asees Kaur, Tanishk Bagchi",
    album: "Shershaah",
    isrc: "INS182100823",
    duration: 230,
    thumbnail: "https://i.ytimg.com/vi/gvyUuxdRdR4/hqdefault.jpg",
    lyrics: `[00:14.00]Teri meri gallan ho gayi mashhoor
[00:19.00]Kar na kabhi tu mujhe nazron se door
[00:25.00]Kithe chaliye tu kithe chaliye
[00:31.00]Kaatun kaise raataan o saawre
[00:37.00]Jiya nahi jaata sun bawre
[00:43.00]Raataan lambiyan lambiyan re`,
    embedding: [0.58, 0.62, 0.48, 0.40, 0.66, 0.0, 0.04, 0.11],
  },
  {
    youtubeId: "RLzC55ai0eo", // Heeriye - Jasleen Royal & Arijit Singh
    title: "Heeriye",
    artist: "Jasleen Royal, Arijit Singh",
    album: "Heeriye",
    isrc: "INW262300001",
    duration: 195,
    thumbnail: "https://i.ytimg.com/vi/RLzC55ai0eo/hqdefault.jpg",
    lyrics: `[00:08.00]Heeriye heeriye aa
[00:15.00]Teri khushboo se mehke saara jahaan
[00:22.00]Heeriye heeriye aa
[00:29.00]Tujhko hi maangoon har ek dua mein`,
    embedding: [0.63, 0.70, 0.54, 0.35, 0.68, 0.0, 0.05, 0.09],
  },
  {
    youtubeId: "xRb8hxwN5zc", // Agar Tum Saath Ho - Tamasha
    title: "Agar Tum Saath Ho",
    artist: "Alka Yagnik, Arijit Singh, A.R. Rahman",
    album: "Tamasha",
    isrc: "INT101501192",
    duration: 341,
    thumbnail: "https://i.ytimg.com/vi/xRb8hxwN5zc/hqdefault.jpg",
    lyrics: `[00:18.00]Pal bhar thehar jaao dil ye sambhal jaaye
[00:25.00]Kaise tumhe roka karun
[00:32.00]Meri taraf aata har gham phisal jaaye
[00:39.00]Aankhon mein tumko bharun
[00:46.00]Agar tum saath ho
[00:52.00]Har dard lage aasan`,
    embedding: [0.46, 0.30, 0.41, 0.62, 0.42, 0.0, 0.03, 0.08],
  },

  // ==========================================
  // TAMIL HITS (KOLLYWOOD & INDIE)
  // ==========================================
  {
    youtubeId: "5L9WN5SJYlY", // Hukum - Jailer
    title: "Hukum - Thalaivar Alappara",
    artist: "Anirudh Ravichander, Super Subu",
    album: "Jailer",
    isrc: "INS172300492",
    duration: 207,
    thumbnail: "https://i.ytimg.com/vi/5L9WN5SJYlY/hqdefault.jpg",
    lyrics: `[00:10.00]Kanna paathuka, un kaathula vechika
[00:14.00]Idhu Thalaivar kalathula aatam dhaan
[00:18.00]Hukum Tiger ka hukum!
[00:22.00]Alappara kelapparom
[00:26.00]Thalaivar nirantharam!`,
    embedding: [0.94, 0.88, 0.78, 0.05, 0.82, 0.01, 0.15, 0.22],
  },
  {
    youtubeId: "3wDiqlTNlfQ", // Naa Ready - Leo
    title: "Naa Ready",
    artist: "Thalapathy Vijay, Anirudh Ravichander, Asal Kolaar",
    album: "Leo",
    isrc: "INS172301211",
    duration: 248,
    thumbnail: "https://i.ytimg.com/vi/3wDiqlTNlfQ/hqdefault.jpg",
    lyrics: `[00:12.00]Naa ready dhaan varavaa
[00:15.00]Annan naan erangi varavaa
[00:19.00]Thael kodukku singatha seendaadha
[00:24.00]Milliyum killiye pathala maapla
[00:29.00]Naa ready dhaan varavaa!`,
    embedding: [0.92, 0.85, 0.75, 0.04, 0.84, 0.0, 0.14, 0.20],
  },
  {
    youtubeId: "ZdMZ40GSVmc", // Badass - Leo
    title: "Badass",
    artist: "Anirudh Ravichander",
    album: "Leo",
    isrc: "INS172301218",
    duration: 229,
    thumbnail: "https://i.ytimg.com/vi/ZdMZ40GSVmc/hqdefault.jpg",
    lyrics: `[00:10.00]Badass Mr Leo das is a badass!
[00:15.00]Maakkelam podra oru mass!
[00:20.00]Kaattukku raaja single dhaan
[00:25.00]Vetaikku vaaraan bullet dhaan!`,
    embedding: [0.95, 0.76, 0.80, 0.02, 0.75, 0.02, 0.12, 0.25],
  },
  {
    youtubeId: "KUN5Uf9mObQ", // Arabic Kuthu - Beast
    title: "Arabic Kuthu - Halamithi Habibo",
    artist: "Anirudh Ravichander, Jonita Gandhi",
    album: "Beast",
    isrc: "INS172200219",
    duration: 280,
    thumbnail: "https://i.ytimg.com/vi/KUN5Uf9mObQ/hqdefault.jpg",
    lyrics: `[00:18.00]Malama pitha pithadhe
[00:21.00]Malama pithaa balma
[00:24.00]Halamithi habibo
[00:28.00]Halamithi habibo balma
[00:32.00]Holiyo holi aagudhe
[00:36.00]Nenjukkul aatam kaanundhe`,
    embedding: [0.88, 0.93, 0.69, 0.06, 0.88, 0.0, 0.08, 0.18],
  },
  {
    youtubeId: "RVLNBVK8auM", // Kaavaalaa - Jailer
    title: "Kaavaalaa",
    artist: "Anirudh Ravichander, Shilpa Rao",
    album: "Jailer",
    isrc: "INS172300488",
    duration: 191,
    thumbnail: "https://i.ytimg.com/vi/RVLNBVK8auM/hqdefault.jpg",
    lyrics: `[00:10.00]Vaa nu sonna vaaran da
[00:14.00]Unakku mattum thaaran da
[00:18.00]Kaavaalaa... nu kaatiko
[00:23.00]En kaathula poovai maatikko`,
    embedding: [0.86, 0.90, 0.65, 0.08, 0.86, 0.0, 0.07, 0.14],
  },
  {
    youtubeId: "VU23OPQ1Pmc", // Katchi Sera - Sai Abhyankkar
    title: "Katchi Sera",
    artist: "Sai Abhyankkar",
    album: "Katchi Sera",
    isrc: "INT202400018",
    duration: 184,
    thumbnail: "https://i.ytimg.com/vi/VU23OPQ1Pmc/hqdefault.jpg",
    lyrics: `[00:08.00]Katchi sera serndha aalae
[00:12.00]Un kaiyai pidikka vandhaene
[00:16.00]Kanne kaniyae un pinnae
[00:20.00]Kaadhal kavithai solvaene`,
    embedding: [0.78, 0.89, 0.62, 0.18, 0.81, 0.0, 0.06, 0.10],
  },
  {
    youtubeId: "a3Ue-LN5B9U", // Aasa Kooda - Sai Abhyankkar
    title: "Aasa Kooda",
    artist: "Sai Abhyankkar, Sai Smriti",
    album: "Aasa Kooda",
    isrc: "INT202400054",
    duration: 215,
    thumbnail: "https://i.ytimg.com/vi/a3Ue-LN5B9U/hqdefault.jpg",
    lyrics: `[00:10.00]Aasa kooda un mela
[00:14.00]Aalam aachu en ninaivil
[00:19.00]Kitta vandhu paatha pothum
[00:24.00]Koodi pogum aayul kaalam`,
    embedding: [0.72, 0.85, 0.58, 0.22, 0.79, 0.0, 0.05, 0.09],
  },
  {
    youtubeId: "x6Q7c9RyMzk", // Rowdy Baby - Maari 2
    title: "Rowdy Baby",
    artist: "Dhanush, Dhee, Yuvan Shankar Raja",
    album: "Maari 2",
    isrc: "INS171800921",
    duration: 284,
    thumbnail: "https://i.ytimg.com/vi/x6Q7c9RyMzk/hqdefault.jpg",
    lyrics: `[00:20.00]Hey en jodi manja kuruvi
[00:23.00]En rowdy baby
[00:27.00]Un mookku mela kovam varume
[00:31.00]En rowdy baby
[00:36.00]Un pottu vacha ponnu naan dhaan`,
    embedding: [0.85, 0.94, 0.70, 0.12, 0.87, 0.0, 0.09, 0.16],
  },
  {
    youtubeId: "JqaV5_f5u54", // Vaathi Coming - Master
    title: "Vaathi Coming",
    artist: "Anirudh Ravichander, Gana Balachandar",
    album: "Master",
    isrc: "INS172000082",
    duration: 228,
    thumbnail: "https://i.ytimg.com/vi/JqaV5_f5u54/hqdefault.jpg",
    lyrics: `[00:15.00]Vaathi coming ottha sollu
[00:18.00]Keda vecha vetti thallu
[00:21.00]Master vandhaaru paaru
[00:24.00]Class room-eh jora aachu!`,
    embedding: [0.93, 0.91, 0.82, 0.03, 0.89, 0.0, 0.11, 0.20],
  },
  {
    youtubeId: "8eYG5QGZAZs", // Hayyoda - Jawan (Tamil)
    title: "Hayyoda",
    artist: "Anirudh Ravichander, Priya Mali",
    album: "Jawan (Tamil)",
    isrc: "INS182302345",
    duration: 200,
    thumbnail: "https://i.ytimg.com/vi/8eYG5QGZAZs/hqdefault.jpg",
    lyrics: `[00:10.00]Hayyoda hayyoda
[00:14.00]En nenjukkul enna kootu
[00:19.00]Un paarvaiyil puyal adikka
[00:23.00]En kaalgal thaan thaalam podum`,
    embedding: [0.73, 0.80, 0.61, 0.17, 0.74, 0.0, 0.05, 0.11],
  },
  {
    youtubeId: "eYq7WapuDLU", // Enjoy Enjaami
    title: "Enjoy Enjaami",
    artist: "Dhee, Arivu, Santhosh Narayanan",
    album: "Enjoy Enjaami",
    isrc: "INM202100012",
    duration: 260,
    thumbnail: "https://i.ytimg.com/vi/eYq7WapuDLU/hqdefault.jpg",
    lyrics: `[00:15.00]Cuckoo cuckoo thaatha thaatha kala vettu
[00:19.00]Cuckoo cuckoo ponnukku yaaru pottu
[00:23.00]Enjoy enjaami vaango vaango onnaagi
[00:27.00]Amma madiyaaru aaraaro paadidu`,
    embedding: [0.82, 0.86, 0.65, 0.20, 0.80, 0.0, 0.12, 0.18],
  },
  {
    youtubeId: "u6GYc1r3fZk", // Megham Karukatha - Thiruchitrambalam
    title: "Megham Karukatha",
    artist: "Dhanush, Anirudh Ravichander",
    album: "Thiruchitrambalam",
    isrc: "INS172200591",
    duration: 247,
    thumbnail: "https://i.ytimg.com/vi/u6GYc1r3fZk/hqdefault.jpg",
    lyrics: `[00:18.00]Megham karukatha penne penne
[00:23.00]Mazhai saaral vizhundhidumo
[00:28.00]Thegam silirkkatha kanne kanne
[00:33.00]Un madiyil saanja podhum`,
    embedding: [0.65, 0.74, 0.52, 0.38, 0.69, 0.0, 0.05, 0.09],
  },
  {
    youtubeId: "g0sYCahy_vg", // Marakkuma Nenjam - VTK
    title: "Marakkuma Nenjam",
    artist: "A.R. Rahman, Thamarai",
    album: "Vendhu Thanindhathu Kaadu",
    isrc: "INS172200781",
    duration: 257,
    thumbnail: "https://i.ytimg.com/vi/g0sYCahy_vg/hqdefault.jpg",
    lyrics: `[00:16.00]Marakkuma nenjam
[00:21.00]Marakkuma nenjam
[00:27.00]Pala aayiram ninaivugal
[00:33.00]Kaatraagi ponathe`,
    embedding: [0.44, 0.34, 0.39, 0.65, 0.46, 0.02, 0.04, 0.08],
  },
  {
    youtubeId: "ew1fKCWb_M4", // Vaseegara - Minnale
    title: "Vaseegara",
    artist: "Bombay Jayashri, Harris Jayaraj",
    album: "Minnale",
    isrc: "INS170100021",
    duration: 300,
    thumbnail: "https://i.ytimg.com/vi/ew1fKCWb_M4/hqdefault.jpg",
    lyrics: `[00:24.00]Vaseegara en nenjinikka
[00:30.00]Un pon madiyil thoonginaal podhum
[00:37.00]Adhey ganam en kannuranga
[00:43.00]Mun jenmangalin yekangal theerum`,
    embedding: [0.38, 0.39, 0.35, 0.82, 0.44, 0.04, 0.03, 0.07],
  },

  // ==========================================
  // MALAYALAM HITS (MOLLYWOOD & INDIE)
  // ==========================================
  {
    youtubeId: "NXM7BC5EOrg", // Illuminati - Aavesham
    title: "Illuminati",
    artist: "Sushin Shyam, Dabzee",
    album: "Aavesham",
    isrc: "INT222400109",
    duration: 204,
    thumbnail: "https://i.ytimg.com/vi/NXM7BC5EOrg/hqdefault.jpg",
    lyrics: `[00:10.00]Adida adi kooduthal illuminati
[00:14.00]Kannu chimmi chimmi ranga annan vathi
[00:18.00]Eduthu vachada rowdy patti
[00:22.00]Bangalore scene muzhuvan maathi!
[00:26.00]Illuminati... ranga anna illuminati!`,
    embedding: [0.96, 0.92, 0.82, 0.03, 0.88, 0.01, 0.16, 0.24],
  },
  {
    youtubeId: "HUAAYwtusLI", // Jaada - Aavesham
    title: "Jaada",
    artist: "Sushin Shyam, MC Couper",
    album: "Aavesham",
    isrc: "INT222400115",
    duration: 198,
    thumbnail: "https://i.ytimg.com/vi/HUAAYwtusLI/hqdefault.jpg",
    lyrics: `[00:12.00]Jaada kaatano jaada kaatano
[00:16.00]Ranga annante munpil aadaano
[00:20.00]Chethu aano gethu aano
[00:24.00]Kollam aano kochi aano
[00:28.00]Scene okke nammal maatum!`,
    embedding: [0.93, 0.88, 0.79, 0.04, 0.85, 0.02, 0.14, 0.20],
  },
  {
    youtubeId: "W6-O00alJUo", // Kuthanthram - Manjummel Boys
    title: "Kuthanthram",
    artist: "Sushin Shyam, Vedan",
    album: "Manjummel Boys",
    isrc: "INT222400042",
    duration: 215,
    thumbnail: "https://i.ytimg.com/vi/W6-O00alJUo/hqdefault.jpg",
    lyrics: `[00:15.00]Kuthanthram kootiya koodu
[00:19.00]Kadam kadha paranja aaru
[00:24.00]Guna cave-il iruttile kaazhcha
[00:28.00]Chankinte chankanu thunayaayi!`,
    embedding: [0.89, 0.65, 0.73, 0.10, 0.78, 0.01, 0.18, 0.19],
  },
  {
    youtubeId: "nYEoxne_20Y", // Neela Nilave - RDX
    title: "Neela Nilave",
    artist: "Jakes Bejoy, Kapil Kapilan",
    album: "RDX",
    isrc: "INT222300581",
    duration: 268,
    thumbnail: "https://i.ytimg.com/vi/nYEoxne_20Y/hqdefault.jpg",
    lyrics: `[00:16.00]Neela nilave en manam arinje
[00:22.00]Thooval pozhiye moham virinje
[00:28.00]Kannil minnum ninte chiri kandu
[00:34.00]Njanum oru paattayi maari!`,
    embedding: [0.75, 0.81, 0.64, 0.22, 0.77, 0.0, 0.05, 0.12],
  },
  {
    youtubeId: "-yyPE9G6A-4", // Darshana - Hridayam
    title: "Darshana",
    artist: "Hesham Abdul Wahab, Darshana Rajendran",
    album: "Hridayam",
    isrc: "INT222100812",
    duration: 275,
    thumbnail: "https://i.ytimg.com/vi/-yyPE9G6A-4/hqdefault.jpg",
    lyrics: `[00:18.00]Onakka munthiri then mazha pozhiye
[00:25.00]Aakaasha chumbana deepangal anaye
[00:32.00]Darshana...
[00:38.00]En jeevanum neeyallo Darshana!`,
    embedding: [0.68, 0.72, 0.58, 0.35, 0.62, 0.0, 0.06, 0.10],
  },
  {
    youtubeId: "WEP5rusbtSE", // Aaraadhike - Ambili
    title: "Aaraadhike",
    artist: "Sooraj Santhosh, Madhuvanthi Narayan, Vishnu Vijay",
    album: "Ambili",
    isrc: "INT221900118",
    duration: 264,
    thumbnail: "https://i.ytimg.com/vi/WEP5rusbtSE/hqdefault.jpg",
    lyrics: `[00:14.00]Aaraadhike manjin thulliyaayi
[00:20.00]Nee ennil peythu thudangi
[00:26.00]Aarorum kaanatha kadal pole
[00:32.00]Nee ennil aazham thozhunnu`,
    embedding: [0.42, 0.48, 0.40, 0.72, 0.50, 0.02, 0.03, 0.07],
  },
  {
    youtubeId: "0G2VxhV_gXM", // Malare - Premam
    title: "Malare",
    artist: "Vijay Yesudas, Rajesh Murugesan",
    album: "Premam",
    isrc: "INT221500041",
    duration: 315,
    thumbnail: "https://i.ytimg.com/vi/0G2VxhV_gXM/hqdefault.jpg",
    lyrics: `[00:28.00]Malare ninne kaanathirunnal
[00:35.00]Mizhiyilla aathmaavil niramilla
[00:42.00]Uyire ennil neeyillayenkil
[00:49.00]Ee lokam poornnamalla`,
    embedding: [0.46, 0.45, 0.43, 0.68, 0.45, 0.01, 0.03, 0.08],
  },
  {
    youtubeId: "P-jKtzUuVcM", // Pavizha Mazha - Athiran
    title: "Pavizha Mazha",
    artist: "K.S. Harisankar, P.S. Jayhari",
    album: "Athiran",
    isrc: "INT221900329",
    duration: 254,
    thumbnail: "https://i.ytimg.com/vi/P-jKtzUuVcM/hqdefault.jpg",
    lyrics: `[00:18.00]Pavizha mazhaye neeyente jeevanil
[00:24.00]Ormmakalayi thazhukiya velayil
[00:31.00]Aaro kaathu vacha sneham pole
[00:38.00]Nee enne thedi vannu`,
    embedding: [0.48, 0.52, 0.45, 0.55, 0.53, 0.0, 0.04, 0.09],
  },
  {
    youtubeId: "DInfmi-YIiw", // Jeevamshamayi - Theevandi
    title: "Jeevamshamayi",
    artist: "K.S. Harisankar, Shreya Ghoshal, Kailas Menon",
    album: "Theevandi",
    isrc: "INT221800102",
    duration: 312,
    thumbnail: "https://i.ytimg.com/vi/DInfmi-YIiw/hqdefault.jpg",
    lyrics: `[00:22.00]Jeevamshamayi thaaneyente
[00:29.00]Mizhiyilekku peythoru kanavu pole
[00:36.00]Swapnam kanda naalum koodi
[00:43.00]Neeyente koode poru`,
    embedding: [0.50, 0.53, 0.46, 0.52, 0.52, 0.0, 0.03, 0.08],
  },
  {
    youtubeId: "GFA9C2h1lJU", // Thalatherichavar - Romancham
    title: "Thalatherichavar",
    artist: "Sushin Shyam, Zia Ul Haq",
    album: "Romancham",
    isrc: "INT222300088",
    duration: 188,
    thumbnail: "https://i.ytimg.com/vi/GFA9C2h1lJU/hqdefault.jpg",
    lyrics: `[00:10.00]Thalatherichavar koodiya veedu
[00:14.00]Ouija board-um vachu kali koodu
[00:18.00]Anamika varumo illayo
[00:22.00]Romancham kerum raavu!`,
    embedding: [0.84, 0.82, 0.68, 0.12, 0.81, 0.02, 0.10, 0.14],
  },
  {
    youtubeId: "_eWvDaztcjI", // Manavalan Thug - Thallumaala
    title: "Manavalan Thug",
    artist: "Dabzee, SA, Vishnu Vijay",
    album: "Thallumaala",
    isrc: "INT222200214",
    duration: 212,
    thumbnail: "https://i.ytimg.com/vi/_eWvDaztcjI/hqdefault.jpg",
    lyrics: `[00:08.00]Manavalan thug vannu kando
[00:12.00]Thallumaala scene kando
[00:16.00]Vazhiye poyoorkkulla aatam
[00:20.00]Nammal keri thakarkkum!`,
    embedding: [0.91, 0.87, 0.76, 0.05, 0.86, 0.0, 0.17, 0.16],
  },
  {
    youtubeId: "WD87mrr6umk", // Ole Melody - Thallumaala
    title: "Ole Melody",
    artist: "Haricharan, Benny Dayal, Vishnu Vijay",
    album: "Thallumaala",
    isrc: "INT222200219",
    duration: 236,
    thumbnail: "https://i.ytimg.com/vi/WD87mrr6umk/hqdefault.jpg",
    lyrics: `[00:15.00]Ole melody kaathil pathiye
[00:20.00]Neeyente chiriyil oru swapnam pole
[00:26.00]Maapla paatinte thaalam ketti
[00:32.00]Odi varunnu ninte arikil`,
    embedding: [0.73, 0.82, 0.63, 0.20, 0.79, 0.0, 0.08, 0.11],
  },
  {
    youtubeId: "nCmEFJmF3sA", // Angu Vaana Konilu - ARM
    title: "Angu Vaana Konilu",
    artist: "Dhibu Ninan Thomas, K.S. Harisankar",
    album: "ARM (Ajayante Randam Moshanam)",
    isrc: "INT222400301",
    duration: 242,
    thumbnail: "https://i.ytimg.com/vi/nCmEFJmF3sA/hqdefault.jpg",
    lyrics: `[00:15.00]Angu vaana konilu
[00:20.00]Thooval meham chaarave
[00:26.00]Manasil oru chithram pole
[00:32.00]Thottu thottu ponnu velicham`,
    embedding: [0.56, 0.58, 0.48, 0.48, 0.54, 0.0, 0.04, 0.09],
  },
];
