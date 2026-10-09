import React from 'react';
import { 
  Volume2, 
  Keyboard, 
  HelpCircle, 
  Headphones, 
  Check, 
  Sliders,
  ShieldAlert
} from 'lucide-react';
import { TypingSettings, SoundTheme } from '../types';
import { playKeySound, playSuccessChime } from '../utils/soundEffects';

interface SettingsViewProps {
  settings: TypingSettings;
  onUpdateSettings: (newSettings: Partial<TypingSettings>) => void;
  onSelectPractice: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onSelectPractice,
}) => {
  const soundThemes: { id: SoundTheme; label: string; desc: string }[] = [
    { id: 'mechanical', label: 'Mechanical Blue Switch', desc: 'Crisp clicky tactile snap on every actuation' },
    { id: 'creamy', label: 'Creamy Thock (Lubed Linear)', desc: 'Deep warm acoustic bass pop, satisfying and subtle' },
    { id: 'bubble', label: 'Playful Bubble Pop', desc: 'Lighthearted water droplet chirp' },
    { id: 'typewriter', label: 'Classic Typewriter', desc: 'Solid vintage metal mechanical keystrokes' },
    { id: 'off', label: 'Muted / Silent Keystrokes', desc: 'Only your music playing without simulated clicks' },
  ];

  const handleTestSound = (theme: SoundTheme) => {
    playKeySound(theme, settings.soundVolume, false);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
        <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2 mb-1">
          <Sliders className="w-4 h-4 text-amber-400" />
          Keyboard Sound & Typing Preferences
        </h3>
        <p className="text-xs text-slate-400 mb-6">
          Customize how your keyboard sounds and feels alongside your Hindi background tracks.
        </p>

        {/* Sound Themes Grid */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">
              Keystroke Sound Profile
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {soundThemes.map(th => {
                const isSelected = settings.soundTheme === th.id;
                return (
                  <div
                    key={th.id}
                    onClick={() => {
                      onUpdateSettings({ soundTheme: th.id });
                      handleTestSound(th.id);
                    }}
                    className={`p-3 rounded-lg border text-left cursor-pointer transition-all flex items-start justify-between ${
                      isSelected
                        ? 'bg-amber-950/20 border-amber-500/40 text-slate-100 shadow-sm shadow-amber-500/10'
                        : 'bg-slate-950/60 border-slate-800 hover:bg-slate-850 hover:border-slate-700 text-slate-400'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold ${isSelected ? 'text-amber-300' : 'text-slate-200'}`}>
                          {th.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">{th.desc}</p>
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-amber-400 shrink-0 ml-2" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Volume Slider */}
          <div className="pt-4 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-medium text-slate-300 flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                Key Sound Volume
              </span>
              <span className="font-mono text-slate-400">{Math.round(settings.soundVolume * 100)}%</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.soundVolume}
                onChange={e => {
                  const vol = parseFloat(e.target.value);
                  onUpdateSettings({ soundVolume: vol });
                  playKeySound(settings.soundTheme, vol, false);
                }}
                className="w-full accent-amber-400 bg-slate-950 rounded-lg cursor-pointer h-1.5"
              />
              <button
                onClick={() => handleTestSound(settings.soundTheme)}
                className="px-2.5 py-1 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 shrink-0 cursor-pointer"
              >
                Test Click
              </button>
            </div>
          </div>

          {/* Toggle Switches */}
          <div className="pt-4 border-t border-slate-800/80 space-y-3">
            <label className="flex items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-800/60 cursor-pointer">
              <div>
                <span className="text-xs font-medium text-slate-200 block">
                  Autoplay Next Song Automatically
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  When the current YouTube song finishes playing, automatically switch to and play the next song.
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.autoAdvanceSongs}
                onChange={e => onUpdateSettings({ autoAdvanceSongs: e.target.checked })}
                className="w-4 h-4 accent-amber-400 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-800/60 cursor-pointer">
              <div>
                <span className="text-xs font-medium text-slate-200 block">
                  Auto-Play Hindi Music on First Keystroke
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  Music starts immediately when you begin typing the first letter.
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.autoPlayMusicOnType}
                onChange={e => onUpdateSettings({ autoPlayMusicOnType: e.target.checked })}
                className="w-4 h-4 accent-amber-400 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-800/60 cursor-pointer">
              <div>
                <span className="text-xs font-medium text-slate-200 block">
                  Confidence Mode (No Backspace)
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  Locks the Backspace key to train forward momentum and flow state.
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.confidenceMode}
                onChange={e => onUpdateSettings({ confidenceMode: e.target.checked })}
                className="w-4 h-4 accent-amber-400 rounded cursor-pointer"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Guide: How to groove & type */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 text-xs text-slate-400 leading-relaxed space-y-2">
        <h4 className="font-semibold text-slate-200 text-sm flex items-center gap-1.5">
          <HelpCircle className="w-4 h-4 text-amber-400" />
          Why Listening to Hindi Melodies Helps Typing Practice
        </h4>
        <p>
          Unlike typing dry corporate paragraphs in silence, listening to melodic tracks like <strong className="text-slate-200">Jhol</strong> or soulful tracks like <strong className="text-slate-200">Pal Pal</strong> puts your brain into a relaxed alpha wave frequency. 
        </p>
        <p>
          You don't write the lyrics—instead, you practice standard English vocabulary (like TypingTest.com / Monkeytype). The music keeps you energized and entertained so 30 minutes of practice feels like 5 minutes.
        </p>
      </div>

      <div className="text-center pt-2">
        <button
          onClick={onSelectPractice}
          className="px-6 py-2.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors cursor-pointer shadow-md"
        >
          Return to Practice
        </button>
      </div>
    </div>
  );
};
