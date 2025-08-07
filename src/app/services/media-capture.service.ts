import { Injectable } from '@angular/core';

export interface MediaCaptureResult {
  type: 'image' | 'video' | 'audio';
  blob: Blob;
  url: string;
  path?: string;
}

export interface PermissionStatus {
  camera: boolean;
  microphone: boolean;
  granted: boolean;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MediaCaptureService {
  private currentStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];

  constructor() {}

  /**
   * Check and request permissions for camera and microphone
   */
  async checkPermissions(needsCamera: boolean = true, needsMicrophone: boolean = false): Promise<PermissionStatus> {
    try {
      const constraints: MediaStreamConstraints = {};
      
      if (needsCamera) {
        constraints.video = true;
      }
      
      if (needsMicrophone) {
        constraints.audio = true;
      }

      // Test permissions by requesting stream
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Clean up test stream
      stream.getTracks().forEach(track => track.stop());
      
      return {
        camera: needsCamera,
        microphone: needsMicrophone,
        granted: true,
        message: 'Permissions granted successfully'
      };
    } catch (error: any) {
      console.error('Permission error:', error);
      
      let message = 'Permission denied. ';
      
      if (error.name === 'NotAllowedError') {
        message += 'Please allow camera/microphone access in your browser settings. ';
        message += this.getPermissionInstructions();
      } else if (error.name === 'NotFoundError') {
        message += 'No camera or microphone found on this device.';
      } else if (error.name === 'NotSupportedError') {
        message += 'Media capture is not supported on this device/browser.';
      } else {
        message += error.message || 'Unknown error occurred.';
      }
      
      return {
        camera: needsCamera,
        microphone: needsMicrophone,
        granted: false,
        message
      };
    }
  }

  /**
   * Get platform-specific permission instructions
   */
  private getPermissionInstructions(): string {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
      return 'On iOS: Go to Settings > Safari > Camera/Microphone and allow access for this website.';
    } else if (userAgent.includes('android')) {
      return 'On Android: Tap the camera icon in the address bar and allow permissions, or go to site settings.';
    } else if (userAgent.includes('chrome')) {
      return 'In Chrome: Click the camera icon in the address bar and select "Always allow" for this site.';
    } else if (userAgent.includes('firefox')) {
      return 'In Firefox: Click the camera icon in the address bar and select "Allow" for this site.';
    } else if (userAgent.includes('safari')) {
      return 'In Safari: Go to Safari > Preferences > Websites > Camera/Microphone and allow access.';
    } else {
      return 'Please check your browser settings to allow camera/microphone access for this website.';
    }
  }

  /**
   * Start camera stream for image/video capture
   */
  async startCameraStream(includeAudio: boolean = false): Promise<MediaStream> {
    // Relaxed constraints for maximum compatibility
    const constraints: MediaStreamConstraints = {
      video: true,
      audio: includeAudio
    };
    this.currentStream = await navigator.mediaDevices.getUserMedia(constraints);
    return this.currentStream;
  }

  /**
   * Start audio-only stream for audio recording
   */
  async startAudioStream(): Promise<MediaStream> {
    const constraints: MediaStreamConstraints = {
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    };
    
    this.currentStream = await navigator.mediaDevices.getUserMedia(constraints);
    return this.currentStream;
  }

  /**
   * Capture image from video stream
   */
  captureImage(videoElement: HTMLVideoElement): Promise<MediaCaptureResult> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;
      
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      
      context.drawImage(videoElement, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const path = `captured-image-${timestamp}.jpg`;
          
          resolve({
            type: 'image',
            blob,
            url,
            path
          });
        }
      }, 'image/jpeg', 0.9);
    });
  }

  /**
   * Start video recording
   */
  startVideoRecording(stream: MediaStream): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.recordedChunks = [];
        
        const options: MediaRecorderOptions = {
          mimeType: this.getSupportedVideoMimeType()
        };
        
        this.mediaRecorder = new MediaRecorder(stream, options);
        
        this.mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            this.recordedChunks.push(event.data);
          }
        };
        
        this.mediaRecorder.onstart = () => resolve();
        this.mediaRecorder.onerror = (event) => reject(event);
        
        this.mediaRecorder.start(1000); // Collect data every second
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Start audio recording
   */
  startAudioRecording(stream: MediaStream): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.recordedChunks = [];
        
        const options: MediaRecorderOptions = {
          mimeType: this.getSupportedAudioMimeType()
        };
        
        this.mediaRecorder = new MediaRecorder(stream, options);
        
        this.mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            this.recordedChunks.push(event.data);
          }
        };
        
        this.mediaRecorder.onstart = () => resolve();
        this.mediaRecorder.onerror = (event) => reject(event);
        
        this.mediaRecorder.start(1000);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Pause recording
   */
  pauseRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.pause();
    }
  }

  /**
   * Resume recording
   */
  resumeRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
      this.mediaRecorder.resume();
    }
  }

  /**
   * Stop recording and return result
   */
  stopRecording(type: 'video' | 'audio'): Promise<MediaCaptureResult> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No active recording'));
        return;
      }
      
      this.mediaRecorder.onstop = () => {
        const mimeType = type === 'video' 
          ? this.getSupportedVideoMimeType() 
          : this.getSupportedAudioMimeType();
          
        const blob = new Blob(this.recordedChunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const extension = type === 'video' ? 'webm' : 'webm';
        const path = `captured-${type}-${timestamp}.${extension}`;
        
        resolve({
          type,
          blob,
          url,
          path
        });
        
        this.recordedChunks = [];
      };
      
      this.mediaRecorder.stop();
    });
  }

  /**
   * Get recording state
   */
  getRecordingState(): RecordingState {
    if (!this.mediaRecorder) {
      return 'inactive';
    }
    return this.mediaRecorder.state;
  }

  /**
   * Stop all streams and clean up
   */
  stopAllStreams(): void {
    if (this.currentStream) {
      this.currentStream.getTracks().forEach(track => track.stop());
      this.currentStream = null;
    }
    
    if (this.mediaRecorder) {
      if (this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
      }
      this.mediaRecorder = null;
    }
  }

  /**
   * Get supported video MIME type
   */
  private getSupportedVideoMimeType(): string {
    const types = [
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm',
      'video/mp4'
    ];
    
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    
    return 'video/webm';
  }

  /**
   * Get supported audio MIME type
   */
  private getSupportedAudioMimeType(): string {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4'
    ];
    
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    
    return 'audio/webm';
  }
}
