import React from 'react';
import BpkText from '@skyscanner/backpack-web/bpk-component-text';
import './App.scss';

function AnotherPage() {
  return (
    <div className="app-container">
      <div className="text-chunk">
        <BpkText textStyle="xxl" tagName="h1" className="headline-text hero-5">
          Another Page
        </BpkText>
        <BpkText textStyle="base" tagName="p" className="body-text">
          This is another page in the application.
        </BpkText>
      </div>
    </div>
  );
}

export default AnotherPage;