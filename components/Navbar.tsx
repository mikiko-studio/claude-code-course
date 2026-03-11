"use client";

import { useState } from "react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0f]/80 backdrop-blur-md border-b border-white/5">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
              CC
            </div>
            <span className="font-semibold text-white">Claude Code 講座</span>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-gray-400 hover:text-white text-sm transition-colors">特徴</a>
            <a href="#curriculum" className="text-gray-400 hover:text-white text-sm transition-colors">カリキュラム</a>
            <a href="#pricing" className="text-gray-400 hover:text-white text-sm transition-colors">料金</a>
            <a href="#faq" className="text-gray-400 hover:text-white text-sm transition-colors">FAQ</a>
          </div>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-3">
            <a
              href="#pricing"
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-medium hover:from-violet-500 hover:to-indigo-500 transition-all"
            >
              今すぐ申し込む
            </a>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-gray-400 hover:text-white"
            onClick={() => setIsOpen(!isOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-white/5 space-y-3">
            <a href="#features" className="block text-gray-400 hover:text-white text-sm py-2" onClick={() => setIsOpen(false)}>特徴</a>
            <a href="#curriculum" className="block text-gray-400 hover:text-white text-sm py-2" onClick={() => setIsOpen(false)}>カリキュラム</a>
            <a href="#pricing" className="block text-gray-400 hover:text-white text-sm py-2" onClick={() => setIsOpen(false)}>料金</a>
            <a href="#faq" className="block text-gray-400 hover:text-white text-sm py-2" onClick={() => setIsOpen(false)}>FAQ</a>
            <a href="#pricing" className="block px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-medium text-center">今すぐ申し込む</a>
          </div>
        )}
      </div>
    </nav>
  );
}
