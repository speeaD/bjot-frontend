import { QuizSettings } from "../types/global";
import ToggleButton from "./ToggleButton";

interface QuizSettingsProps {
    settings: QuizSettings;
    onSettingsChange: (settings: QuizSettings) => void;
}
export function ToggleSwitch({ value, onChange } : { value: boolean; onChange: (v: boolean) => void }) {
    return (
        <div className="flex items-center">
            <span className="mr-3 font-semibold text-gray-700 text-sm">
                {value ? 'Yes' : 'No'}
            </span>
            <button
                onClick={() => onChange(!value)}
                className={`w-12 h-6 rounded-full transition-colors ${
                    value ? 'bg-indigo-600' : 'bg-gray-300'
                }`}
            >
                <div
                    className={`w-5 h-5 bg-white rounded-full transition-transform ${
                        value ? 'translate-x-6' : 'translate-x-1'
                    }`}
                />
            </button>
        </div>
    );
}

export default function QuizSettingsComponent({ settings, onSettingsChange } : QuizSettingsProps) {
    const updateSetting = <K extends keyof QuizSettings>(key: K, value: QuizSettings[K]): void => {
        onSettingsChange({ ...settings, [key]: value });
    };

    const updateDuration = (field: keyof QuizSettings['duration'], value: number): void => {
        onSettingsChange({
            ...settings,
            duration: { ...settings.duration, [field]: value }
        });
    };

    

    return (
        <div className="space-y-4">
            {/* Cover Image */}
            <div className="bg-white rounded-lg shadow p-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                    <div className="flex flex-col items-center">
                        <div className="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center mb-4">
                            <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <span className="text-gray-400 text-xs mb-4">OPTIONAL</span>
                        <button className="px-6 py-2 border-2 border-blue-bg text-blue-bg rounded-lg font-medium hover:bg-blue-bg hover:text-white ">
                            Add a cover image
                        </button>
                    </div>
                </div>
            </div>

            {/* Quiz Title */}
            <div className="bg-white rounded-lg shadow p-4">
                <label className="block text-lg font-semibold text-gray-800 mb-2">
                    Quiz Title
                </label>
                <input
                    type="text"
                    value={settings.title}
                    onChange={(e) => updateSetting('title', e.target.value)}
                    placeholder="Make it short and simple."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
            </div>
            {/* Make quiz a challenge */}
            <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-gray-800 text-lg mb-2">Make quiz open?</h3>
                        <p className="text-gray-600">
                            If you make this quiz a open, Anybody can participate without login.
                        </p>
                    </div>
                    <ToggleSwitch value={settings.isOpenQuiz || false} 
                        onChange={(val) => updateSetting('isOpenQuiz', val)} />
                </div>
            </div>
            {/* Description */}
            <div className="bg-white rounded-lg shadow p-4">
                <label className="block text-lg font-semibold text-gray-800 mb-2">
                    Description <span className="text-xs font-normal text-gray-500">OPTIONAL</span>
                </label>
                <textarea
                    value={settings.description}
                    onChange={(e) => updateSetting('description', e.target.value)}
                    placeholder="Add a short description"
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
            </div>

            {/* Instruction */}
            <div className="bg-white rounded-lg shadow p-4">
                <label className="block text-lg font-semibold text-gray-800 mb-2">
                    Instruction <span className="text-xs font-normal text-gray-500">OPTIONAL</span>
                </label>
                <textarea
                    value={settings.instructions || ''}
                    onChange={(e) => updateSetting('instructions', e.target.value)}
                    placeholder="Tell people how you want them to answer the quiz"
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
            </div>
            <div className="bg-white rounded-lg shadow p-4">
                <label className="block text-lg font-semibold text-gray-800 mb-2">
                    Duration <span className="text-xs font-normal text-gray-500">OPTIONAL</span>
                </label>
                <p className="text-sm text-gray-600 bg-gray-50 px-4 py-3 rounded-lg mb-4">
                    Set how long it would take to complete this quiz
                </p>
                <div className="flex gap-4">
                    <div>
                        <select
                            value={settings.duration.hours}
                            onChange={(e) => updateDuration('hours', Number(e.target.value))}
                            className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-24"
                        >
                            {[...Array(24)].map((_, i) => (
                                <option key={i} value={i}>{i}</option>
                            ))}
                        </select>
                        <div className="text-sm font-semibold text-gray-700 mt-2">HR</div>
                    </div>
                    <div>
                        <select
                            value={settings.duration.minutes}
                            onChange={(e) => updateDuration('minutes', Number(e.target.value))}
                            className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-24"
                        >
                            {[...Array(60)].map((_, i) => (
                                <option key={i} value={i}>{i}</option>
                            ))}
                        </select>
                        <div className="text-sm font-semibold text-gray-700 mt-2">MIN</div>
                    </div>
                    <div>
                        <select
                            value={settings.duration.seconds}
                            onChange={(e) => updateDuration('seconds', Number(e.target.value))}
                            className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-24"
                        >
                            {[...Array(60)].map((_, i) => (
                                <option key={i} value={i}>{i}</option>
                            ))}
                        </select>
                        <div className="text-sm font-semibold text-gray-700 mt-2">SEC</div>
                    </div>
                </div>
            </div>
            {/* Quiz Settings */}
            <div className="bg-white rounded-lg shadow p-6 space-y-6">
               

                <div>
                    <h3 className="font-semibold text-gray-800 text-sm mb-3">Allow People Attempt This Quiz Multiple Times?</h3>
                    <ToggleButton value={settings.multipleAttempts || false} 
                        onChange={(val) => updateSetting('multipleAttempts', val)}  />
                </div>

                <div>
                    <h3 className="font-semibold text-gray-800 text-sm mb-3">Permit Users To Lose Focus?</h3>
                    <ToggleButton value={settings.permitLoseFocus || false} onChange={(val) => updateSetting('permitLoseFocus', val)} />
                </div>

                <div>
                    <h3 className="font-semibold text-gray-800 text-sm mb-3">Allow Users To View Answer?</h3>
                    <ToggleButton value={settings.viewAnswer || false} 
                        onChange={(val) => updateSetting('viewAnswer', val)}  />
                </div>

                <div>
                    <h3 className="font-semibold text-gray-800 text-sm mb-3">Allow Users To See Result?</h3>
                    <ToggleButton value={settings.viewResults || false} 
                        onChange={(val) => updateSetting('viewResults', val)} />
                </div>

                <div>
                    <h3 className="font-semibold text-gray-800 text-sm mb-3">Display Calculator</h3>
                    <ToggleButton value={settings.displayCalculator || false} 
                        onChange={(val) => updateSetting('displayCalculator', val)}  />
                </div>
            </div>

        </div>
    );
}