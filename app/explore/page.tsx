import Image from "next/image";
export default function Explore() {
    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center">
                        <h1 className="text-2xl font-bold text-gray-800">Explore Quizzes</h1>
                    </div>
                </div>
            </header>

            <div className="flex flex-col items-center justify-center py-20">
                            <div className="mb-2">
                            <Image src="/assets/illustration.jpg" alt="No quizzes" width={300} height={300} />
                            </div>
                            <h3 className="text-2xl font-semibold text-gray-800 mb-0">It&apos;s a little quiet here</h3>
                            <p className="text-gray-500 mb-2 text-m">Create a quiz to see updates here.</p>
                          </div>
         </div>

    );
}