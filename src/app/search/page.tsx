'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, Music, Disc, Youtube, Sparkles, Filter, Globe } from 'lucide-react';
import { Track } from '@/types';
import { TrackCard } from '@/components/discovery/TrackCard';
import { Skeleton } from '@/components/ui/Skeleton';

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [activeFilter, setActiveFilter] = useState<'all' | 'youtube' | 'catalog'>('all');
  const [results, setResults] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);

  const performSearch = async (q: string, filter: 'all' | 'youtube' | 'catalog' = activeFilter) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(q.trim())}&source=${filter}&limit=30`
      );
      if (res.ok) {
        const data = await res.json();
        setResults(data.tracks || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      performSearch(initialQuery, activeFilter);
    }
  }, [initialQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(query, activeFilter);
  };

  const handleFilterChange = (filter: 'all' | 'youtube' | 'catalog') => {
    setActiveFilter(filter);
    if (query.trim()) {
      performSearch(query, filter);
    }
  };

  const quickPicks = [
    'Kesariya Arijit Singh',
    'Illuminati Aavesham',
    'Tauba Tauba Karan Aujla',
    'Hukum Anirudh Jailer',
    'Katchi Sera Sai Abhyankkar',
    'Darshana Hridayam',
  ];

  const youtubeCount = results.filter((t) => t.source === 'youtube').length;
  const catalogCount = results.filter((t) => t.source !== 'youtube').length;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 animate-fadeIn select-none">
      {/* Search Header Form */}
      <div className="max-w-3xl mx-auto space-y-4">
        <form onSubmit={handleSubmit} className="relative">
          <Search className="w-5 h-5 text-content-muted absolute left-4 top-3.5" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search songs, artists, or paste YouTube link..."
            className="w-full glass-pill rounded-full pl-12 pr-28 py-3.5 text-sm text-white placeholder:text-content-muted outline-none focus:border-brand-primary/60 focus:ring-1 focus:ring-brand-primary/40 transition-all shadow-xl"
          />
          <button
            type="submit"
            className="absolute right-2 top-2 px-6 py-2 rounded-full bg-brand-primary text-[#0A0A0A] text-xs font-bold hover:shadow-[0_4px_16px_rgba(16,229,117,0.4)] active:scale-95 transition-all shadow-md"
          >
            Search
          </button>
        </form>

        {/* Quick Suggestion Chips */}
        <div className="flex items-center gap-2 pt-1 overflow-x-auto pb-1 no-scrollbar text-nowrap">
          <span className="font-mono text-[11px] uppercase tracking-wider text-outline px-1">Trending:</span>
          {[
            { label: 'Synthwave', query: 'Synthwave Synth Pop', icon: 'bolt' },
            { label: 'Indie Acoustic', query: 'Indian Indie Acoustic Prateek Kuhad', icon: 'nature_people' },
            { label: 'Lossless 24-bit', query: 'Lossless High Resolution Audio', icon: 'music_cast' },
            { label: 'Electronic Pulse', query: 'Electronic Dance Nu-Disco', icon: 'electric_bolt' },
            { label: 'Bollywood Retro', query: 'Bollywood Retro Classics Kishore Kumar', icon: 'surround_sound' },
            { label: 'Spatial Stems', query: 'Spatial Audio Dolby Atmos', icon: 'headset' },
            { label: 'Punjabi Power', query: 'Punjabi Hip Hop Karan Aujla', icon: 'queue_music' },
            { label: 'Tamil Anthems', query: 'Tamil Chartbusters Anirudh', icon: 'audiotrack' },
          ].map((item, idx) => (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                setQuery(item.query);
                performSearch(item.query, activeFilter);
              }}
              className={`group flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                idx === 0
                  ? 'bg-primary text-on-primary shadow-sm hover:scale-105'
                  : 'bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
              }`}
            >
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {/* Source Filter Tabs */}
        {query.trim() && (
          <div className="flex items-center gap-2 pt-2 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={() => handleFilterChange('all')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeFilter === 'all'
                  ? 'bg-brand-primary text-[#0A0A0A] font-bold shadow-[0_4px_16px_rgba(16,229,117,0.25)]'
                  : 'glass-pill text-content-secondary hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>All Sources ({results.length})</span>
            </button>

            <button
              type="button"
              onClick={() => handleFilterChange('youtube')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeFilter === 'youtube'
                  ? 'bg-red-500 text-white font-bold shadow-[0_4px_16px_rgba(239,68,68,0.3)]'
                  : 'glass-pill text-content-secondary hover:text-white'
              }`}
            >
              <Youtube className="w-3.5 h-3.5" />
              <span>YouTube Stream ({youtubeCount})</span>
            </button>

            <button
              type="button"
              onClick={() => handleFilterChange('catalog')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeFilter === 'catalog'
                  ? 'bg-brand-primary text-[#0A0A0A] font-bold shadow-[0_4px_16px_rgba(16,229,117,0.25)]'
                  : 'glass-pill text-content-secondary hover:text-white'
              }`}
            >
              <Disc className="w-3.5 h-3.5" />
              <span>Catalog ({catalogCount})</span>
            </button>
          </div>
        )}
      </div>

      {/* Results Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-2xl" />
          ))}
        </div>
      ) : results.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-white/50 font-mono">
            <span>
              Found {results.length} songs for &ldquo;{query}&rdquo;
            </span>
            <span className="text-emerald-400 font-semibold">Web Audio DSP Active</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {results.map((track) => (
              <TrackCard key={track.id} track={track} playlistContext={results} />
            ))}
          </div>
        </div>
      ) : query.trim() ? (
        <div className="p-16 text-center text-white/50 space-y-2 glass-panel border border-white/10 rounded-3xl max-w-xl mx-auto shadow-xl">
          <Music className="w-10 h-10 mx-auto text-white/20" />
          <p className="text-sm font-semibold text-white">No results found for &ldquo;{query}&rdquo;</p>
          <p className="text-xs text-white/50">
            Try a different search term, artist name, or paste a direct YouTube video URL.
          </p>
        </div>
      ) : (
        /* Section: Browse All Genres & Moods (Visual Bento Mosaic from Stitch Explore Design) */
        <section className="py-4 space-y-5">
          <div className="flex items-baseline justify-between border-b border-white/[0.06] pb-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-on-surface">
                Browse All Genres &amp; Moods
              </h2>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Selected master categories with dynamic acoustic indexing
              </p>
            </div>
            <div className="text-xs font-mono text-outline">
              10 curated categories
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              {
                title: 'Pop Anthems',
                plays: '3.2M Plays',
                query: 'Top Pop Anthems Chartbusters',
                gradient: 'bg-gradient-to-br from-[#d4145a] to-[#910d3f]',
                img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAERWagOAyfegnKhzg5nupNqyQDu6TYVzYh5v0POX1z2LZaALHPkd4H3i-zGMJ0MDj2PDscKkWKvO2E9pdybXTKLrvO9afqa6Jmsra0k6XBHvOiMRLlKhWgtS7aht3vzQ6fWqIZUey5xhWFvNAwKQpMlbUF_v9qCspdkHBOFiFQkVxSmzAVI2-Cab3bV2-deYthJtNZ6p8LDKdhYcutnT7r54bkcKmNBRU2v7KHAw',
              },
              {
                title: 'EDM & Waves',
                plays: '138 - 174 BPM',
                query: 'EDM Festival Club Bangers',
                gradient: 'bg-gradient-to-br from-[#0ae474] to-[#016830]',
                img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDGCIF7A95yeZkj2DOUp5relNwBEB9FQnsRmAvffAjVGbfq25VrQcaBBtWaSzmc7KJk9GWL3U9q1cJUEQQk8aL3iRScP41c3D0z5VKWoXwvx_oy0enwvWmYDROqDy_mUU3qoBXhhgnTtK0MH2xaWkX3_RD1oEGst8yH_690-Vg6GVVmsdjXXv2RaaoRx40BvYphyOoHj9H7MaoNovsR_X3DSceugo_6NQfAm9Wfgg',
              },
              {
                title: 'Hip-Hop Vault',
                plays: 'Fresh Cyphers',
                query: 'Desi Hip Hop Punjabi Rap',
                gradient: 'bg-gradient-to-br from-[#f59e0b] to-[#b45309]',
                img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCNwmCTPWFU_zecZIkT1OT1lPfVahidzdKfWjV8dmQcwgbKXeuzSAqs0IXL93QJeAJOwQuXswwG65_wsDd-x-mzFqJBkCzaMCuWbUYqlAA0Nl-bU_PtqXFZCqdq6dPx99SARJxmcg4jdIHMKVct2fe3CDuD6NyPjvl0qsvQeZltGVpbFod4BxQ4tjyAfkNWQy8eyHFvkB8JlvKIubYLTPs0O7_ghxqv2TzYAXihvg',
              },
              {
                title: 'Bollywood Classics',
                plays: 'Vintage & OST',
                query: 'Bollywood Retro Classics Romantic',
                gradient: 'bg-gradient-to-br from-[#7e22ce] to-[#3b0764]',
                img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBvGxLjMVcMZ91Z5o9g6VX5jcqIyc4wdjrSaqzlD_ufxu0q9SQnOxzrLU2EZzqrP1YMOAkxubsHiArIdGR7yejey_16Xkwh1h0Wpw1gTWDhLNu8BrXtSbhpd8vJtEQqbqfuIEzRlN1viR6FpIfM41HLV0V_7S-R3dMOzgpHda8E3WHEwxG60mTXszgwcU7kp0A2lDzlZw-u6b-WSyJb_m77tp7xTjzPMhkIylX6MQ',
              },
              {
                title: 'Indie Vibes',
                plays: 'Lo-Fi Dream',
                query: 'Indian Indie Acoustic Melodies',
                gradient: 'bg-gradient-to-br from-[#0284c7] to-[#0c4a6e]',
                img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCSCZG3WO-nsHdtdKMTozxhfmpLxY07Ie9tWVxtvq56LxGXEJz5lBbvf7ntuUi8JLCvA_ghu0hm13nH7d2i7Ka6Zwcn9j1_duQQ-9AMkSLMMAQtqYWg_BSEqYD7HDKNhw6wOb-gQqxVW92R1Tl3Cqq-p-cJaG1NKYcYqy_XuWtDWB1jWFZrUKsm17s2Qtbjk5bficH1aKFe6QeWQYm4eg5SunHJmExJPlvztsUBLA',
              },
              {
                title: 'Chill Lo-Fi',
                plays: 'Deep Focus',
                query: 'Lo-Fi Chill Beats Study Relax',
                gradient: 'bg-gradient-to-br from-[#0d9488] to-[#134e4a]',
                img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBGE1KY1jKuYX8D3yrCsGRd0ddk1hTeUOADnnxkFVwrEc-ARbjqq9hU8LAHjJqWaCDCeP-NYfmydQGQ0edZY05FaLdNhiKpH2ichRoV0ENAFiDoiEQmG1asbwGuTxrFSp1NoHrPCkZHmk-lWanSMFWSCF1BOywXnEBMJhxoNnnd4UoXxXhO0hHwBqgaKOVe9zwM9ZrGiYrqXZ-1e2g9LlWR22Ul7RbioOHYU4Qy5w',
              },
              {
                title: 'Rock Arena',
                plays: 'Heavy Riffs',
                query: 'Rock Metal Anthems Alternative',
                gradient: 'bg-gradient-to-br from-[#ea580c] to-[#7c2d12]',
                img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCnd9P5EUBbm2jkMCu42eRRh9PaZ0oxODgbDCXQdYRPbIJITCWov468pMR546UQonpBHnhYpOtZ2hgMGHfXRfnNa0GUv-wxu_UZX_ONg7P40eejuM4HrLdmZRmuuJQCORo7MLkM84WIBCoxm6WsSG9Gam_z_g385RtLGIddoBV5a_hzdg4O3YdzdOzyWI3hSgANftUFWdQlbccPIZAkeVTV53YpqpeVzE6AbvwQYw',
              },
              {
                title: 'High Octane',
                plays: 'Cardio • 155 BPM',
                query: 'Workout High BPM Bass Boost',
                gradient: 'bg-gradient-to-br from-[#4f46e5] to-[#1e1b4b]',
                img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBrWLKKlYcZJJF_9nDIhPacLaKYV9KCMb90txVdjpALUCyUqtzJRdoCwPWAvY23KRxl2G54Zv8Bs2LVwxfE-QXoBt0B_SfBw0tQ3Lzym63Tik3ApXW9WMmEik2GLPq5JJ233_w6r5mqErQ5_tiCbmqIVg-tSz1INuTEYmCl2rQGgFPI6_rSqlpWefGtZsqX1REXTBkoyqKuxbqSjncyX1yRLjRkV32Vso_GAoUUiQ',
              },
              {
                title: 'Ambient Sleep',
                plays: 'Delta Waves 432Hz',
                query: 'Ambient Sleep Serene Soundscapes',
                gradient: 'bg-gradient-to-br from-[#334155] to-[#0f172a]',
                img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD7bvsL_6geZfyNZpkYCiImAWc_jkBBzbiNqUJX-79tpiQiEwo8xWVbNOP9OehNAaADKQnOxsCLx6-HLHAYvIi12PRrqwIGbUxbvNweCTNxorQzWntabkGtvCqAIFRkWxwia3i3nzayrLuH_gr2VvsFXOOazeybeubZ_9qCu1hINUktKox5jFWBEl9AvzPqKHy0I4pEit6-SpS7pTycKCMkT-4paIXbodfvxaQtGA',
              },
              {
                title: 'Gaming Energy',
                plays: 'Bassline Boost',
                query: 'Gaming Energy Bass Phonk',
                gradient: 'bg-gradient-to-br from-[#84cc16] to-[#3f6212]',
                img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAnF4S6NIttGueyJIQYJNtJEeTlvIIdjKvgnEWptQ0DuUgKz20NJzkiomezSu_iCYoxPFC0uG6BLpjEqd5FPGXRq4O0GRkYHUSa8FSFHuvQAkG2R_72j38EIvjtMt9Q0ncAlzovyG6uxWiqEOLcp6-IB9BEUCHPM6nEE2cvZ87EqYwtS9s8XQRr_OB5SYTTErO37LKSFey_0fnE0exEAe2x34kfgJzyAm5--gn6gA',
              },
            ].map((cat) => (
              <div
                key={cat.title}
                onClick={() => {
                  setQuery(cat.query);
                  performSearch(cat.query, activeFilter);
                }}
                className={`group relative h-48 rounded-2xl p-5 overflow-hidden cursor-pointer ${cat.gradient} shadow-md hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border border-white/10`}
              >
                <div className="relative z-10 flex flex-col justify-between h-full select-none">
                  <span className="text-lg font-extrabold text-white leading-tight drop-shadow-sm">
                    {cat.title}
                  </span>
                  <span className="font-mono text-[10px] text-white/80 uppercase tracking-widest font-semibold">
                    {cat.plays}
                  </span>
                </div>
                <div className="absolute -right-4 -bottom-4 w-28 h-28 rounded-xl overflow-hidden shadow-2xl rotate-[20deg] group-hover:rotate-[14deg] group-hover:scale-110 transition-transform duration-300 border border-white/20">
                  <img
                    src={cat.img}
                    alt={cat.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-8 text-obsidian-secondary">Loading search...</div>}>
      <SearchContent />
    </Suspense>
  );
}
