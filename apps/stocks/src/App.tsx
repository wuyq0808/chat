import React from 'react';
import { Routes, Route } from 'react-router-dom';
import BpkText from '@skyscanner/backpack-web/bpk-component-text';
import AnotherPage from './AnotherPage';
import './App.scss';

function HomePage() {
  return (
    <div className="app-container">
      {/* Text Chunk Component - Updated to match Figma */}
      <div className="text-chunk">
        <BpkText textStyle="xxl" tagName="h1" className="headline-text hero-5">
          Headline Text?
        </BpkText>
        <BpkText textStyle="lg" tagName="h2" className="subheading">
          Subheading?
        </BpkText>
        <BpkText textStyle="base" tagName="p" className="body-text">
          Body Text?
        </BpkText>
      </div>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/another" element={<AnotherPage />} />
    </Routes>
  );
}

export default App;