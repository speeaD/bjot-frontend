import { Check } from "lucide-react";

export default function ToggleButton({ value, onChange, yesText = "Yes", noText = "No" }: { value: boolean; onChange: (v: boolean) => void; yesText?: string; noText?: string }) {
    return (
        <div className="flex gap-3">
            <button
                onClick={() => onChange(true)}
                className={`px-6 py-2 rounded-lg font-medium transition-colors text-sm ${value
                        ? 'bg-green-600 text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
            >
                {value && <Check className="inline w-4 h-4 mr-2" />}
                {yesText}
            </button>
            <button
                onClick={() => onChange(false)}
                className={`px-6 py-2 rounded-lg font-medium transition-colors text-sm ${!value
                        ? 'bg-white text-gray-700 border-2 border-gray-400'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
            >
                {noText}
            </button>
        </div>
    );
}