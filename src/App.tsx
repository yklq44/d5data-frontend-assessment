import styles from './App.module.css';
import illustration from './assets/illustration.png';
import { UploadCard } from './components/UploadCard/UploadCard';

export default function App() {
  return (
    <main className={styles.page}>
      <header className={styles.intro}>
        <h1 className={styles.title}>
          <span>Finish!</span> <span>Upload Your Resume</span>
        </h1>
        <p className={styles.lead}>
          Upload your resume, the platform will help you parse and optimize, you can also skip this step
        </p>
      </header>

      <UploadCard className={styles.card} />

      <img
        className={styles.illustration}
        src={illustration}
        alt=""
        width={675}
        height={503}
        decoding="async"
        draggable={false}
      />
    </main>
  );
}
