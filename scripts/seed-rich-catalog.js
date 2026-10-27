const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const SONGS = [
  // Pop & Synthpop
  { youtubeId: 'JGwWNGJdvx8', title: 'Shape of You', artist: 'Ed Sheeran', duration: 233, thumbnail: 'https://img.youtube.com/vi/JGwWNGJdvx8/hqdefault.jpg', embedding: [0.82, 0.93, 0.65, 0.58, 0.82, 0.0, 0.08, 0.09] },
  { youtubeId: '4NRXx6U8ABQ', title: 'Blinding Lights', artist: 'The Weeknd', duration: 200, thumbnail: 'https://img.youtube.com/vi/4NRXx6U8ABQ/hqdefault.jpg', embedding: [0.8, 0.38, 0.72, 0.0, 0.51, 0.09, 0.06, 0.09] },
  { youtubeId: 'LsoLEjrDogU', title: 'Get Lucky', artist: 'Daft Punk ft. Pharrell Williams', duration: 248, thumbnail: 'https://img.youtube.com/vi/LsoLEjrDogU/hqdefault.jpg', embedding: [0.86, 0.86, 0.62, 0.04, 0.79, 0.0, 0.07, 0.1] },
  { youtubeId: 'lp-EO5I60KA', title: 'Levitating', artist: 'Dua Lipa', duration: 203, thumbnail: 'https://img.youtube.com/vi/lp-EO5I60KA/hqdefault.jpg', embedding: [0.82, 0.91, 0.63, 0.01, 0.7, 0.0, 0.06, 0.06] },
  { youtubeId: '09R8_2nJtjg', title: 'Sugar', artist: 'Maroon 5', duration: 235, thumbnail: 'https://img.youtube.com/vi/09R8_2nJtjg/hqdefault.jpg', embedding: [0.79, 0.88, 0.6, 0.06, 0.75, 0.0, 0.03, 0.08] },
  { youtubeId: 'YQHsXMglC9A', title: 'Hello', artist: 'Adele', duration: 295, thumbnail: 'https://img.youtube.com/vi/YQHsXMglC9A/hqdefault.jpg', embedding: [0.45, 0.29, 0.45, 0.34, 0.48, 0.0, 0.03, 0.08] },
  { youtubeId: 'CevxZvSJLk8', title: 'Roar', artist: 'Katy Perry', duration: 223, thumbnail: 'https://img.youtube.com/vi/CevxZvSJLk8/hqdefault.jpg', embedding: [0.77, 0.55, 0.68, 0.0, 0.55, 0.0, 0.04, 0.08] },
  { youtubeId: 'fJ9rUzIMcZQ', title: 'Bohemian Rhapsody', artist: 'Queen', duration: 355, thumbnail: 'https://img.youtube.com/vi/fJ9rUzIMcZQ/hqdefault.jpg', embedding: [0.4, 0.22, 0.4, 0.27, 0.41, 0.0, 0.05, 0.3] },
  { youtubeId: 'kXYiU_JCYtU', title: 'Numb', artist: 'Linkin Park', duration: 187, thumbnail: 'https://img.youtube.com/vi/kXYiU_JCYtU/hqdefault.jpg', embedding: [0.86, 0.24, 0.68, 0.0, 0.5, 0.0, 0.04, 0.64] },
  { youtubeId: 'hT_nvWreIhg', title: 'Counting Stars', artist: 'OneRepublic', duration: 257, thumbnail: 'https://img.youtube.com/vi/hT_nvWreIhg/hqdefault.jpg', embedding: [0.71, 0.48, 0.64, 0.07, 0.66, 0.0, 0.04, 0.12] },
  { youtubeId: 'fKopy74weus', title: 'Thunder', artist: 'Imagine Dragons', duration: 187, thumbnail: 'https://img.youtube.com/vi/fKopy74weus/hqdefault.jpg', embedding: [0.82, 0.29, 0.67, 0.01, 0.6, 0.13, 0.04, 0.33] },
  { youtubeId: 'uelHwf8o7_U', title: 'Love the Way You Lie', artist: 'Eminem ft. Rihanna', duration: 263, thumbnail: 'https://img.youtube.com/vi/uelHwf8o7_U/hqdefault.jpg', embedding: [0.93, 0.64, 0.48, 0.24, 0.75, 0.0, 0.23, 0.52] },

  // More Global Mega Hits
  { youtubeId: 'OPf0YbXqDm0', title: 'Uptown Funk', artist: 'Mark Ronson ft. Bruno Mars', duration: 270, thumbnail: 'https://img.youtube.com/vi/OPf0YbXqDm0/hqdefault.jpg', embedding: [0.89, 0.93, 0.59, 0.01, 0.86, 0.0, 0.08, 0.03] },
  { youtubeId: '2Vv-BfVoq4g', title: 'Perfect', artist: 'Ed Sheeran', duration: 263, thumbnail: 'https://img.youtube.com/vi/2Vv-BfVoq4g/hqdefault.jpg', embedding: [0.45, 0.17, 0.43, 0.16, 0.6, 0.0, 0.02, 0.11] },
  { youtubeId: '7wtfhZwyrcc', title: 'Believer', artist: 'Imagine Dragons', duration: 204, thumbnail: 'https://img.youtube.com/vi/7wtfhZwyrcc/hqdefault.jpg', embedding: [0.78, 0.66, 0.63, 0.06, 0.78, 0.0, 0.13, 0.08] },
  { youtubeId: 'RgKAFK5djSk', title: 'See You Again', artist: 'Wiz Khalifa ft. Charlie Puth', duration: 238, thumbnail: 'https://img.youtube.com/vi/RgKAFK5djSk/hqdefault.jpg', embedding: [0.48, 0.28, 0.44, 0.1, 0.69, 0.0, 0.08, 0.06] },
  { youtubeId: 'kJQP7kiw5Fk', title: 'Despacito', artist: 'Luis Fonsi ft. Daddy Yankee', duration: 288, thumbnail: 'https://img.youtube.com/vi/kJQP7kiw5Fk/hqdefault.jpg', embedding: [0.8, 0.82, 0.89, 0.21, 0.66, 0.0, 0.15, 0.07] },
  { youtubeId: 'k2qgadSvNyU', title: 'New Rules', artist: 'Dua Lipa', duration: 209, thumbnail: 'https://img.youtube.com/vi/k2qgadSvNyU/hqdefault.jpg', embedding: [0.7, 0.61, 0.59, 0.0, 0.76, 0.0, 0.07, 0.15] },
  { youtubeId: 'DyDfgMOUjCI', title: 'Bad Guy', artist: 'Billie Eilish', duration: 194, thumbnail: 'https://img.youtube.com/vi/DyDfgMOUjCI/hqdefault.jpg', embedding: [0.43, 0.56, 0.68, 0.33, 0.7, 0.13, 0.38, 0.1] },
  { youtubeId: 'H5v3kku4y6Q', title: 'As It Was', artist: 'Harry Styles', duration: 167, thumbnail: 'https://img.youtube.com/vi/H5v3kku4y6Q/hqdefault.jpg', embedding: [0.73, 0.66, 0.88, 0.12, 0.52, 0.0, 0.06, 0.31] },
  { youtubeId: 'wXhTHyIgQ_U', title: 'Circles', artist: 'Post Malone', duration: 215, thumbnail: 'https://img.youtube.com/vi/wXhTHyIgQ_U/hqdefault.jpg', embedding: [0.76, 0.55, 0.6, 0.19, 0.69, 0.0, 0.04, 0.09] },
  { youtubeId: 'SlPhMPnQ58k', title: 'Memories', artist: 'Maroon 5', duration: 189, thumbnail: 'https://img.youtube.com/vi/SlPhMPnQ58k/hqdefault.jpg', embedding: [0.32, 0.57, 0.46, 0.84, 0.76, 0.0, 0.05, 0.08] },
  { youtubeId: 'nfWlot6h_JM', title: 'Shake It Off', artist: 'Taylor Swift', duration: 242, thumbnail: 'https://img.youtube.com/vi/nfWlot6h_JM/hqdefault.jpg', embedding: [0.8, 0.94, 0.8, 0.06, 0.65, 0.0, 0.17, 0.34] },
  { youtubeId: 'e-ORhEE9VVg', title: 'Blank Space', artist: 'Taylor Swift', duration: 272, thumbnail: 'https://img.youtube.com/vi/e-ORhEE9VVg/hqdefault.jpg', embedding: [0.7, 0.57, 0.48, 0.1, 0.76, 0.0, 0.05, 0.09] },
  { youtubeId: '3tmd-ClpJxA', title: 'Starboy', artist: 'The Weeknd ft. Daft Punk', duration: 230, thumbnail: 'https://img.youtube.com/vi/3tmd-ClpJxA/hqdefault.jpg', embedding: [0.59, 0.49, 0.93, 0.14, 0.68, 0.0, 0.28, 0.13] },
  { youtubeId: 'XXYlFuWEuKI', title: 'Save Your Tears', artist: 'The Weeknd', duration: 216, thumbnail: 'https://img.youtube.com/vi/XXYlFuWEuKI/hqdefault.jpg', embedding: [0.83, 0.64, 0.59, 0.02, 0.68, 0.0, 0.03, 0.54] },
  { youtubeId: 'fHI8X4893Ts', title: 'Can\'t Feel My Face', artist: 'The Weeknd', duration: 215, thumbnail: 'https://img.youtube.com/vi/fHI8X4893Ts/hqdefault.jpg', embedding: [0.77, 0.58, 0.54, 0.11, 0.7, 0.0, 0.04, 0.11] },
  { youtubeId: 'papuvlVeZg8', title: 'Closer', artist: 'The Chainsmokers ft. Halsey', duration: 245, thumbnail: 'https://img.youtube.com/vi/papuvlVeZg8/hqdefault.jpg', embedding: [0.52, 0.66, 0.47, 0.41, 0.75, 0.0, 0.03, 0.1] },
  { youtubeId: 'FM7MFYoylVs', title: 'Something Just Like This', artist: 'The Chainsmokers & Coldplay', duration: 247, thumbnail: 'https://img.youtube.com/vi/FM7MFYoylVs/hqdefault.jpg', embedding: [0.64, 0.45, 0.58, 0.05, 0.62, 0.0, 0.03, 0.16] },
  { youtubeId: 'dvgZkm1xWPE', title: 'Viva La Vida', artist: 'Coldplay', duration: 242, thumbnail: 'https://img.youtube.com/vi/dvgZkm1xWPE/hqdefault.jpg', embedding: [0.62, 0.42, 0.69, 0.1, 0.49, 0.0, 0.03, 0.15] },
  { youtubeId: 'YykjpeuMNEk', title: 'Hymn For The Weekend', artist: 'Coldplay', duration: 260, thumbnail: 'https://img.youtube.com/vi/YykjpeuMNEk/hqdefault.jpg', embedding: [0.69, 0.42, 0.45, 0.01, 0.49, 0.0, 0.05, 0.21] },
  { youtubeId: '1k8craCGpgs', title: 'Don\'t Start Now', artist: 'Dua Lipa', duration: 183, thumbnail: 'https://img.youtube.com/vi/1k8craCGpgs/hqdefault.jpg', embedding: [0.79, 0.68, 0.62, 0.01, 0.79, 0.0, 0.08, 0.1] },
  { youtubeId: 'QGJuMBdaqIw', title: 'Firework', artist: 'Katy Perry', duration: 235, thumbnail: 'https://img.youtube.com/vi/QGJuMBdaqIw/hqdefault.jpg', embedding: [0.83, 0.65, 0.62, 0.14, 0.64, 0.0, 0.05, 0.11] },
  { youtubeId: 'btPJPFnesV4', title: 'Eye of the Tiger', artist: 'Survivor', duration: 245, thumbnail: 'https://img.youtube.com/vi/btPJPFnesV4/hqdefault.jpg', embedding: [0.86, 0.54, 0.55, 0.13, 0.81, 0.0, 0.03, 0.09] },
  { youtubeId: 'Zi_XLOBDo_Y', title: 'Billie Jean', artist: 'Michael Jackson', duration: 294, thumbnail: 'https://img.youtube.com/vi/Zi_XLOBDo_Y/hqdefault.jpg', embedding: [0.51, 0.85, 0.59, 0.02, 0.92, 0.0, 0.08, 0.04] },
  { youtubeId: 'sOnqjkJTMaA', title: 'Thriller', artist: 'Michael Jackson', duration: 357, thumbnail: 'https://img.youtube.com/vi/sOnqjkJTMaA/hqdefault.jpg', embedding: [0.88, 0.72, 0.59, 0.05, 0.77, 0.0, 0.09, 0.23] },
  { youtubeId: 'bpOSxM0rNPM', title: 'Do I Wanna Know?', artist: 'Arctic Monkeys', duration: 272, thumbnail: 'https://img.youtube.com/vi/bpOSxM0rNPM/hqdefault.jpg', embedding: [0.56, 0.41, 0.43, 0.19, 0.55, 0.02, 0.03, 0.19] },
  { youtubeId: 'hLQl3WQQoQ0', title: 'Someone Like You', artist: 'Adele', duration: 285, thumbnail: 'https://img.youtube.com/vi/hLQl3WQQoQ0/hqdefault.jpg', embedding: [0.33, 0.28, 0.68, 0.89, 0.56, 0.0, 0.03, 0.1] },
  { youtubeId: '2Vv-BfVoq4g', title: 'Photograph', artist: 'Ed Sheeran', duration: 259, thumbnail: 'https://img.youtube.com/vi/2Vv-BfVoq4g/hqdefault.jpg', embedding: [0.38, 0.2, 0.54, 0.61, 0.61, 0.0, 0.05, 0.1] },
  { youtubeId: '04854XqcfCY', title: 'We Will Rock You', artist: 'Queen', duration: 122, thumbnail: 'https://img.youtube.com/vi/04854XqcfCY/hqdefault.jpg', embedding: [0.7, 0.5, 0.41, 0.68, 0.69, 0.0, 0.12, 0.26] },
  { youtubeId: 'kxpcFljwJws', title: 'Another One Bites the Dust', artist: 'Queen', duration: 215, thumbnail: 'https://img.youtube.com/vi/kxpcFljwJws/hqdefault.jpg', embedding: [0.52, 0.75, 0.55, 0.12, 0.82, 0.0, 0.06, 0.16] },
  { youtubeId: 'eVTXPUF4Oz4', title: 'In The End', artist: 'Linkin Park', duration: 216, thumbnail: 'https://img.youtube.com/vi/eVTXPUF4Oz4/hqdefault.jpg', embedding: [0.86, 0.4, 0.53, 0.01, 0.56, 0.0, 0.05, 0.12] },
  { youtubeId: 'xFYQQPAOz7Y', title: 'Mockingbird', artist: 'Eminem', duration: 258, thumbnail: 'https://img.youtube.com/vi/xFYQQPAOz7Y/hqdefault.jpg', embedding: [0.65, 0.28, 0.42, 0.23, 0.64, 0.0, 0.28, 0.13] },
  { youtubeId: '_Yhyp-_hX2s', title: 'Lose Yourself', artist: 'Eminem', duration: 326, thumbnail: 'https://img.youtube.com/vi/_Yhyp-_hX2s/hqdefault.jpg', embedding: [0.74, 0.06, 0.86, 0.01, 0.69, 0.0, 0.26, 0.36] },
  { youtubeId: 'JRfuAukYTKg', title: 'Titanium', artist: 'David Guetta ft. Sia', duration: 245, thumbnail: 'https://img.youtube.com/vi/JRfuAukYTKg/hqdefault.jpg', embedding: [0.79, 0.3, 0.63, 0.07, 0.6, 0.15, 0.1, 0.11] },
  { youtubeId: '2zToEPp4ghI', title: 'Wake Me Up', artist: 'Avicii', duration: 272, thumbnail: 'https://img.youtube.com/vi/2zToEPp4ghI/hqdefault.jpg', embedding: [0.78, 0.64, 0.62, 0.0, 0.53, 0.0, 0.05, 0.16] },
  { youtubeId: 'IcrbM1l_BoI', title: 'The Nights', artist: 'Avicii', duration: 176, thumbnail: 'https://img.youtube.com/vi/IcrbM1l_BoI/hqdefault.jpg', embedding: [0.84, 0.65, 0.63, 0.02, 0.53, 0.0, 0.11, 0.25] },
  { youtubeId: '1y6smkh6cBQ', title: 'Don\'t You Worry Child', artist: 'Swedish House Mafia', duration: 212, thumbnail: 'https://img.youtube.com/vi/1y6smkh6cBQ/hqdefault.jpg', embedding: [0.84, 0.44, 0.65, 0.11, 0.61, 0.0, 0.05, 0.13] }
];

async function seed() {
  console.log('Seeding rich catalog tracks...');
  for (const song of SONGS) {
    await prisma.track.upsert({
      where: { youtubeId: song.youtubeId },
      update: {
        title: song.title,
        artist: song.artist,
        duration: song.duration,
        thumbnail: song.thumbnail,
        embedding: JSON.stringify(song.embedding),
      },
      create: {
        youtubeId: song.youtubeId,
        title: song.title,
        artist: song.artist,
        duration: song.duration,
        thumbnail: song.thumbnail,
        embedding: JSON.stringify(song.embedding),
      },
    });
  }
  const total = await prisma.track.count();
  console.log(`Finished! Total tracks now in database: ${total}`);
  await prisma.$disconnect();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});

