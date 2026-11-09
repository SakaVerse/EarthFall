import { ZoneConfig, ZoneId } from './types';

export const CANVAS_VIRTUAL_WIDTH = 1280;
export const CANVAS_VIRTUAL_HEIGHT = 720;

export const EARTH_RADIUS = 36;
export const GRAVITY = 720; // pixels / s^2 downward
export const JUMP_IMPULSE = -390; // pixels / s upward
export const DIVE_IMPULSE = 420; // downward quick dodge
export const MAX_FALL_SPEED = 500;
export const MAX_RISE_SPEED = -450;
export const HORIZONTAL_POSITION_RATIO = 0.22; // Earth stands at ~22% from left

export const MAX_HEALTH = 100;
export const HEALTH_RECOVERY_ENERGY = 25;

export const BASE_GAME_SPEED = 280; // px/s
export const MAX_GAME_SPEED = 620;

export const ZONES: Record<ZoneId, ZoneConfig> = {
  solar_system: {
    id: 'solar_system',
    name: 'Zone 1: Solar System Outskirts',
    subtitle: 'Leaving the familiar heliosphere behind',
    minDistance: 0,
    maxDistance: 2500,
    bgGradient: ['#070B19', '#0d1527', '#03050a'],
    nebulaColors: ['rgba(30, 58, 138, 0.25)', 'rgba(217, 119, 6, 0.15)'],
    ambientColor: '#38bdf8',
    starColor: '#e0f2fe',
    obstacleMultipliers: {
      speed: 1.0,
      density: 1.0,
      hazardVariety: 1,
    },
  },
  asteroid_belt: {
    id: 'asteroid_belt',
    name: 'Zone 2: Main Asteroid Belt',
    subtitle: 'Navigating dense fields of planetary debris',
    minDistance: 2500,
    maxDistance: 6000,
    bgGradient: ['#170d05', '#24140b', '#080502'],
    nebulaColors: ['rgba(180, 83, 9, 0.25)', 'rgba(234, 88, 12, 0.18)'],
    ambientColor: '#f59e0b',
    starColor: '#fef3c7',
    obstacleMultipliers: {
      speed: 1.15,
      density: 1.25,
      hazardVariety: 2,
    },
  },
  dark_nebula: {
    id: 'dark_nebula',
    name: 'Zone 3: Dark Nebula Veil',
    subtitle: 'Cosmic clouds where light is swallowed',
    minDistance: 6000,
    maxDistance: 11000,
    bgGradient: ['#0d0417', '#1a082e', '#05020a'],
    nebulaColors: ['rgba(126, 34, 206, 0.35)', 'rgba(79, 70, 229, 0.25)'],
    ambientColor: '#c084fc',
    starColor: '#f3e8ff',
    obstacleMultipliers: {
      speed: 1.3,
      density: 1.45,
      hazardVariety: 3,
    },
  },
  frozen_space: {
    id: 'frozen_space',
    name: 'Zone 4: Glacial Expanse',
    subtitle: 'Absolute zero ice fields and crystal storms',
    minDistance: 11000,
    maxDistance: 17500,
    bgGradient: ['#02131d', '#052233', '#010a0f'],
    nebulaColors: ['rgba(8, 145, 178, 0.3)', 'rgba(56, 189, 248, 0.2)'],
    ambientColor: '#22d3ee',
    starColor: '#e0f7fa',
    obstacleMultipliers: {
      speed: 1.45,
      density: 1.6,
      hazardVariety: 4,
    },
  },
  unknown_universe: {
    id: 'unknown_universe',
    name: 'Zone 5: The Unknown Universe',
    subtitle: 'Uncharted quantum anomalies & cosmic gates',
    minDistance: 17500,
    maxDistance: 999999,
    bgGradient: ['#12031c', '#200533', '#08010d'],
    nebulaColors: ['rgba(236, 72, 153, 0.3)', 'rgba(139, 92, 246, 0.35)', 'rgba(6, 182, 212, 0.25)'],
    ambientColor: '#e879f9',
    starColor: '#fdf4ff',
    obstacleMultipliers: {
      speed: 1.6,
      density: 1.8,
      hazardVariety: 5,
    },
  },
};

export const POWER_UP_CONFIG = {
  SHIELD: {
    name: 'Magnetic Shield',
    color: '#38bdf8',
    glowColor: 'rgba(56, 189, 248, 0.6)',
    duration: 8,
    symbol: '🛡️',
  },
  ENERGY: {
    name: 'Biosphere Repair',
    color: '#10b981',
    glowColor: 'rgba(16, 185, 129, 0.6)',
    duration: 0, // Instant
    symbol: '🌱',
  },
  TIME_CONTROL: {
    name: 'Chrono Warp',
    color: '#a855f7',
    glowColor: 'rgba(168, 85, 247, 0.6)',
    duration: 7,
    symbol: '⏳',
  },
  COSMIC_BOOST: {
    name: 'Hyper-Drive Boost',
    color: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.6)',
    duration: 5,
    symbol: '⚡',
  },
  MAGNET: {
    name: 'Gravitational Magnet',
    color: '#06b6d4',
    glowColor: 'rgba(6, 182, 212, 0.6)',
    duration: 10,
    symbol: '🧲',
  },
};
