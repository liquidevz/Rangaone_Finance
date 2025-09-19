"use client"

import { Instagram } from "lucide-react"

const directors = [
  {
    name: "Eleanor\nPena",
    role: "Founder/FIORAI"
  },
  {
    name: "Ralph\nEdwards", 
    role: "Director"
  },
  {
    name: "Annette\nBlack",
    role: "Office Manager"
  },
  {
    name: "Jacob\nJones",
    role: "Sales Consultant"
  }
]

export function DirectorsSection() {
  return (
    <section className="py-20 px-4 bg-gradient-to-br from-purple-200 via-purple-100 to-white">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-5xl md:text-7xl font-bold text-center text-blue-900 mb-20 leading-tight">
          Meet The<br />Amazing Directors
        </h2>
        
        <div className="grid grid-cols-2 gap-6 max-w-4xl mx-auto">
          {directors.map((director, index) => (
            <div key={index} className="aspect-square bg-gray-300 rounded-lg relative overflow-hidden">
              <div className="absolute inset-0 flex flex-col justify-between p-8">
                <div className="text-white">
                  <h3 className="text-4xl md:text-5xl font-light leading-none whitespace-pre-line">
                    {director.name}
                  </h3>
                </div>
                <div className="flex items-end justify-between">
                  <div className="flex gap-4">
                    <Instagram className="w-6 h-6 text-white" />
                    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                    <span className="text-white text-sm font-normal">{director.role}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}