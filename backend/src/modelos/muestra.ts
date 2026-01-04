export interface Muestra {
  sampleId: string;
  location: string;
  zone: string;
  sampleType: string;
  collectionDate: string;
  parameters: {
    pH: number;
    temperature: number;
    conductivity: number;
    turbidity: number;
    dissolvedOxygen: number;
    heavyMetals: {
      lead: number;
      mercury: number;
      arsenic: number;
    };
    vocs: number;
    pm25: number;
    pm10: number;
    noiseLevel: number;
  };
  status: string;
  operator: string;
  labCode: string;
  notes: string;
}
