import React from 'react';
import homeImg from '../../assets/home.png';
import styles from './Home.module.css';

const Home = () => {
  return (
    <div className={styles.homeContainer}>
      <img src={homeImg} alt="Home Dashboard" className={styles.homeImage} />
    </div>
  );
};

export default Home;
