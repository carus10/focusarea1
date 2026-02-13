import React, { Suspense, lazy } from 'react';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../utils/animations';
import PomodoroWidget from '../components/PomodoroWidget.tsx';
import MusicWidget from '../components/MusicWidget.tsx';
import MotivationWidget from '../components/MotivationWidget.tsx';

// Lazy load heavy chart component
const PomodoroHistory = lazy(() => import('../components/PomodoroHistory.tsx'));

const Dashboard: React.FC = () => {
  return (
    <motion.div
      className="space-y-6"
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <motion.h1
        className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-violet-400 dark:to-violet-300"
        variants={staggerItem}
      >
        Dashboard
      </motion.h1>
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        variants={staggerItem}
      >
        <motion.div className="lg:col-span-1" variants={staggerItem}>
          <PomodoroWidget />
        </motion.div>
        <motion.div className="lg:col-span-2 grid grid-rows-2 gap-6" variants={staggerItem}>
            <motion.div className="row-span-1" variants={staggerItem}>
                <MusicWidget />
            </motion.div>
            <motion.div className="row-span-1" variants={staggerItem}>
                <MotivationWidget />
            </motion.div>
        </motion.div>
      </motion.div>
      <motion.div variants={staggerItem}>
        <Suspense fallback={<div className="h-64 bg-white/5 backdrop-blur-xl rounded-2xl animate-pulse" />}>
          <PomodoroHistory />
        </Suspense>
      </motion.div>
    </motion.div>
  );
};

export default Dashboard;
