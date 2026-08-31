import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { AppiumHealthDto, TriggerTACWebhookDto } from './dto/tac-trigger.dto';

@Injectable()
export class TACService {
  private readonly logger = new Logger(TACService.name);
  private readonly tacBaseUrl = process.env.TAC_URL || 'http://localhost:8000';

  /**
   * TAC Sağlık Kontrolü
   */
  async checkHealth() {
    try {
      const response = await axios.get(`${this.tacBaseUrl}/api/health`, { timeout: 3000 });
      return {
        online: true,
        data: response.data,
      };
    } catch (error: any) {
      this.logger.warn(`TAC Health Check Failed: ${error.message}`);
      return {
        online: false,
        error: error.message,
        tacBaseUrl: this.tacBaseUrl,
      };
    }
  }

  /**
   * Cihaz Kataloğunu Getir
   */
  async getDevices() {
    try {
      const response = await axios.get(`${this.tacBaseUrl}/api/devices`, { timeout: 5000 });
      return response.data;
    } catch (error: any) {
      this.logger.warn(`TAC Get Devices Failed: ${error.message}`);
      return {
        success: false,
        error: `TAC Sunucusuna bağlanılamadı (${this.tacBaseUrl}): ${error.message}`,
        data: [],
      };
    }
  }

  /**
   * Canlı USB & Emülatör Taraması Yap (Live Scan)
   */
  async scanDevices() {
    try {
      const response = await axios.get(`${this.tacBaseUrl}/api/devices/scan`, { timeout: 8000 });
      return response.data;
    } catch (error: any) {
      this.logger.warn(`TAC Scan Devices Failed: ${error.message}`);
      return {
        success: false,
        error: `TAC Cihaz taraması yapılamadı (${this.tacBaseUrl}): ${error.message}`,
        scannedCount: 0,
        data: [],
      };
    }
  }

  /**
   * Appium Port / Sunucu Sağlık Kontrolü
   */
  async checkAppiumHealth(dto: AppiumHealthDto) {
    try {
      const response = await axios.post(`${this.tacBaseUrl}/api/devices/health`, dto, { timeout: 5000 });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: `Appium sağlık kontrolü başarısız: ${error.message}`,
      };
    }
  }

  /**
   * TAC'ta Tanımlı Tüm Spec ve Case Kodlarını Listele
   */
  async getSpecs() {
    try {
      const response = await axios.get(`${this.tacBaseUrl}/api/specs`, { timeout: 5000 });
      return response.data;
    } catch (error: any) {
      this.logger.warn(`TAC Get Specs Failed: ${error.message}`);
      return {
        success: false,
        error: `TAC Spec listesi alınamadı: ${error.message}`,
        count: 0,
        data: [],
      };
    }
  }

  /**
   * TAC Hazır Test Planlarını Getir
   */
  async getPlans() {
    try {
      const response = await axios.get(`${this.tacBaseUrl}/api/specs/plans`, { timeout: 5000 });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: `TAC Test planları alınamadı: ${error.message}`,
        data: [],
      };
    }
  }

  /**
   * TAC Koşularını Listele
   */
  async getRuns() {
    try {
      const response = await axios.get(`${this.tacBaseUrl}/api/runs`, { timeout: 5000 });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: `TAC Koşuları alınamadı: ${error.message}`,
        data: [],
      };
    }
  }

  /**
   * Tekil Koşu Detayını Getir
   */
  async getRunDetails(runId: string) {
    try {
      const response = await axios.get(`${this.tacBaseUrl}/api/runs/${runId}`, { timeout: 5000 });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: `TAC Koşu detayı alınamadı (${runId}): ${error.message}`,
      };
    }
  }

  /**
   * Devam Eden Koşuyu Durdur (Abort)
   */
  async stopRun(runId: string) {
    try {
      const response = await axios.post(`${this.tacBaseUrl}/api/runs/${runId}/stop`, {}, { timeout: 5000 });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: `TAC Koşusu durdurulamadı (${runId}): ${error.message}`,
      };
    }
  }

  /**
   * TAC Defect Kayıtlarını Getir
   */
  async getDefects() {
    try {
      const response = await axios.get(`${this.tacBaseUrl}/api/defects`, { timeout: 5000 });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: `TAC Hataları alınamadı: ${error.message}`,
        data: [],
      };
    }
  }
}
