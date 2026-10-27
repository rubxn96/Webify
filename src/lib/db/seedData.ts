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
  {
    youtubeId: "fJ9rUzIMcZQ", // Queen - Bohemian Rhapsody
    title: "Bohemian Rhapsody",
    artist: "Queen",
    album: "A Night at the Opera",
    isrc: "GBUM71029604",
    duration: 354,
    thumbnail: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80",
    lyrics: `[00:01.00]Is this the real life? Is this just fantasy?
[00:07.50]Caught in a landslide, no escape from reality
[00:15.00]Open your eyes, look up to the skies and see
[00:23.00]I'm just a poor boy, I need no sympathy
[00:29.00]Because I'm easy come, easy go, little high, little low
[00:36.50]Any way the wind blows doesn't really matter to me, to me
[00:54.00]Mama, just killed a man
[01:00.00]Put a gun against his head, pulled my trigger, now he's dead
[01:09.00]Mama, life had just begun
[01:15.00]But now I've gone and thrown it all away
[01:22.00]Mama, ooh, didn't mean to make you cry
[01:30.00]If I'm not back again this time tomorrow
[01:34.50]Carry on, carry on as if nothing really matters`,
    embedding: [0.65, 0.42, 0.48, 0.38, 0.41, 0.05, 0.06, 0.28],
  },
  {
    youtubeId: "kXYiU_JCYtU", // Linkin Park - Numb
    title: "Numb",
    artist: "Linkin Park",
    album: "Meteora",
    isrc: "USWB10300481",
    duration: 187,
    thumbnail: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80",
    lyrics: `[00:18.00]I'm tired of being what you want me to be
[00:22.50]Feeling so faithless, lost under the surface
[00:27.00]Don't know what you're expecting of me
[00:31.00]Put under the pressure of walking in your shoes
[00:36.00]Every step that I take is another mistake to you
[00:41.50]I've become so numb, I can't feel you there
[00:46.50]Become so tired, so much more aware
[00:50.50]I'm becoming this, all I want to do
[00:54.50]Is be more like me and be less like you`,
    embedding: [0.88, 0.35, 0.62, 0.02, 0.52, 0.0, 0.08, 0.33],
  },
  {
    youtubeId: "4NRXx6U8ABQ", // The Weeknd - Blinding Lights
    title: "Blinding Lights",
    artist: "The Weeknd",
    album: "After Hours",
    isrc: "USUG11904206",
    duration: 200,
    thumbnail: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80",
    lyrics: `[00:15.00]Yeah
[00:27.00]I've been tryna call
[00:30.00]I've been on my own for long enough
[00:34.00]Maybe you can show me how to love, maybe
[00:41.00]I'm going through withdrawals
[00:44.00]You don't even have to do too much
[00:48.00]You can turn me on with just a touch, baby
[00:55.00]I look around and Sin City's cold and empty
[00:59.00]No one's around to judge me
[01:02.50]I can't see clearly when you're gone
[01:09.00]I said, ooh, I'm blinded by the lights
[01:16.00]No, I can't sleep until I feel your touch`,
    embedding: [0.73, 0.65, 0.85, 0.01, 0.68, 0.0, 0.05, 0.09],
  },
  {
    youtubeId: "hT_nvWreIhg", // OneRepublic - Counting Stars
    title: "Counting Stars",
    artist: "OneRepublic",
    album: "Native",
    isrc: "USUM71302832",
    duration: 257,
    thumbnail: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&auto=format&fit=crop&q=80",
    lyrics: `[00:01.00]Lately, I've been, I've been losing sleep
[00:05.50]Dreaming about the things that we could be
[00:09.50]But, baby, I've been, I've been praying hard
[00:13.50]Said no more counting dollars, we'll be counting stars
[00:33.50]I see this life, like a swinging vine
[00:36.50]Swing my heart across the line
[00:39.00]In my face is flashing signs
[00:41.00]Seek it out and ye shall find`,
    embedding: [0.71, 0.58, 0.65, 0.06, 0.66, 0.0, 0.04, 0.12],
  },
  {
    youtubeId: "09R8_2nJtjg", // Maroon 5 - Sugar
    title: "Sugar",
    artist: "Maroon 5",
    album: "V",
    isrc: "USUM71412093",
    duration: 235,
    thumbnail: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=600&auto=format&fit=crop&q=80",
    lyrics: `[00:08.00]I'm hurting, baby, I'm broken down
[00:12.50]I need your loving, loving, I need it now
[00:16.50]When I'm without you, I'm something weak
[00:20.50]You got me begging, begging, I'm on my knees
[00:25.00]I don't wanna be needing your love
[00:29.00]I just wanna be deep in your love
[00:33.00]Sugar, yes please
[00:37.00]Won't you come and put it down on me?`,
    embedding: [0.79, 0.88, 0.60, 0.06, 0.75, 0.0, 0.03, 0.08],
  },
  {
    youtubeId: "JGwWNGJdvx8", // Ed Sheeran - Shape of You
    title: "Shape of You",
    artist: "Ed Sheeran",
    album: "÷ (Divide)",
    isrc: "GBAHS1600463",
    duration: 233,
    thumbnail: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80",
    lyrics: `[00:08.50]The club isn't the best place to find a lover
[00:11.00]So the bar is where I go
[00:13.00]Me and my friends at the table doing shots
[00:16.00]Drinking fast and then we talk slow
[00:18.50]Come over and start up a conversation with just me
[00:21.00]And trust me I'll give it a chance now
[00:27.00]Girl, you know I want your love
[00:30.00]Your love was handmade for somebody like me
[00:35.00]I'm in love with the shape of you
[00:38.00]We push and pull like a magnet do`,
    embedding: [0.65, 0.93, 0.48, 0.58, 0.82, 0.0, 0.08, 0.09],
  },
  {
    youtubeId: "LsoLEjrDogU", // Daft Punk - Get Lucky
    title: "Get Lucky",
    artist: "Daft Punk ft. Pharrell Williams",
    album: "Random Access Memories",
    isrc: "USQX91300105",
    duration: 248,
    thumbnail: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80",
    lyrics: `[00:20.00]Like the legend of the phoenix
[00:24.00]All ends with beginnings
[00:28.00]What keeps the planet spinning
[00:32.00]The force from the beginning
[00:36.00]We've come too far to give up who we are
[00:44.00]So let's raise the bar and our cups to the stars
[00:52.00]She's up all night 'til the sun
[00:54.00]I'm up all night to get some
[00:56.00]She's up all night for good fun
[00:58.00]I'm up all night to get lucky`,
    embedding: [0.81, 0.86, 0.58, 0.04, 0.79, 0.01, 0.06, 0.10],
  },
  {
    youtubeId: "YQHsXMglC9A", // Adele - Hello
    title: "Hello",
    artist: "Adele",
    album: "25",
    isrc: "GBBKS1500214",
    duration: 295,
    thumbnail: "https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=600&auto=format&fit=crop&q=80",
    lyrics: `[00:15.00]Hello, it's me
[00:19.50]I was wondering if after all these years you'd like to meet
[00:26.00]To go over everything
[00:30.00]They say that time's supposed to heal ya, but I ain't done much healing
[00:40.00]Hello, can you hear me?
[00:44.00]I'm in California dreaming about who we used to be
[01:05.00]Hello from the other side
[01:11.00]I must've called a thousand times
[01:16.00]To tell you I'm sorry for everything that I've done`,
    embedding: [0.45, 0.28, 0.40, 0.33, 0.48, 0.0, 0.03, 0.09],
  },
  {
    youtubeId: "CevxZvSJLk8", // Katy Perry - Roar
    title: "Roar",
    artist: "Katy Perry",
    album: "Prism",
    isrc: "USUM71309325",
    duration: 223,
    thumbnail: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&auto=format&fit=crop&q=80",
    lyrics: `[00:07.50]I used to bite my tongue and hold my breath
[00:11.00]Scared to rock the boat and make a mess
[00:15.00]So I sat quietly, agreed politely
[00:23.00]I guess that I forgot I had a choice
[00:26.50]I let you push me past the breaking point
[00:30.50]I stood for nothing, so I fell for everything
[00:37.50]You held me down, but I got up
[00:41.50]Already brushing off the dust
[00:45.00]I got the eye of the tiger, a fighter
[00:49.00]Dancing through the fire
[00:53.00]'Cause I am a champion, and you're gonna hear me roar`,
    embedding: [0.77, 0.55, 0.82, 0.04, 0.55, 0.0, 0.04, 0.31],
  },
  {
    youtubeId: "lp-EO5I60KA", // Dua Lipa - Levitating
    title: "Levitating",
    artist: "Dua Lipa",
    album: "Future Nostalgia",
    isrc: "GBAHT1901299",
    duration: 203,
    thumbnail: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&auto=format&fit=crop&q=80",
    lyrics: `[00:08.50]If you wanna run away with me, I know a galaxy
[00:12.50]And I can take you for a ride
[00:16.50]I had a premonition that we fell into a rhythm
[00:20.50]Where the music don't stop for life
[00:24.00]Glitter in the sky, glitter in my eyes
[00:28.00]Shining just the way I like
[00:32.00]If you're feeling like you need a little bit of company
[00:36.50]You met me at the perfect time
[00:39.50]You want me, I want you, baby
[00:43.00]My sugarboo, I'm levitating`,
    embedding: [0.82, 0.91, 0.52, 0.01, 0.70, 0.0, 0.06, 0.06],
  },
  {
    youtubeId: "fKopy74weus", // Imagine Dragons - Thunder
    title: "Thunder",
    artist: "Imagine Dragons",
    album: "Evolve",
    isrc: "USUM71703861",
    duration: 187,
    thumbnail: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=600&auto=format&fit=crop&q=80",
    lyrics: `[00:08.00]Just a young gun with a quick fuse
[00:12.00]I was uptight, wanna let loose
[00:15.50]I was dreaming of bigger things
[00:19.00]And wanna leave my own life behind
[00:23.00]Not a yes sir, not a follower
[00:26.50]Fit the box, fit the mold
[00:30.00]Have a seat in the foyer, take a number
[00:33.50]I was lightning before the thunder
[00:38.00]Thunder, feel the thunder
[00:42.00]Lightning and the thunder`,
    embedding: [0.82, 0.47, 0.78, 0.01, 0.60, 0.08, 0.05, 0.15],
  },
  {
    youtubeId: "uelHwf8o7_U", // Eminem - Love the Way You Lie ft. Rihanna
    title: "Love the Way You Lie",
    artist: "Eminem ft. Rihanna",
    album: "Recovery",
    isrc: "USUM71015155",
    duration: 263,
    thumbnail: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80",
    lyrics: `[00:01.00]Just gonna stand there and watch me burn?
[00:06.00]Well, that's alright, because I like the way it hurts
[00:13.00]Just gonna stand there and hear me cry?
[00:18.00]Well, that's alright, because I love the way you lie
[00:24.00]I love the way you lie
[00:26.50]I can't tell you what it really is
[00:28.50]I can only tell you what it feels like
[00:31.00]And right now there's a steel knife in my windpipe`,
    embedding: [0.93, 0.62, 0.44, 0.24, 0.75, 0.0, 0.43, 0.52],
  }
];

