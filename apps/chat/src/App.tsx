import { Routes, Route } from 'react-router-dom';
import styles from './App.module.scss';
import { ChatPage } from './ChatPage';

export function App() {
  return (
    <div className={styles.app}>
      <Routes>
        <Route path="/" element={<ChatPage />} />
      </Routes>
    </div>
  );
}

export default App; 