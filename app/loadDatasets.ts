import color from './data/ColorCompatibility.json';
import pattern from './data/PatternCompatibility.json';
import texture from './data/TextureCompatibility.json';
import structure from './data/StructureCompatibility.json';
import skin from './data/SkinTonecompatibility.json';
import occasion from './data/OccasionStyleCompatibility.json';
import proportion from './data/ProportionCompatibility.json';
import styleComp from './data/StyleCompatibility.json';
import styleBreak from './data/Stylebreakdown.json';
import weather from './data/WeatherCompatibility.json';
import point from './data/Pointsystem.json';

export const loadAllDatasets = async () => {
  return {
    ColorCompatibility: color,
    PatternCompatibility: pattern,
    TextureCompatibility: texture,
    StructureCompatibility: structure,
    SkinToneCompatibility: skin,
    OccasionStyleCompatibility: occasion,
    ProportionCompatibility: proportion,
    StyleCompatibility: styleComp,
    Stylebreakdown: styleBreak,
    WeatherCompatibility: weather,
    Pointsystem: point
  };
};
