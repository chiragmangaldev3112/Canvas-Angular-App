import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MediaCaptureService, MediaCaptureResult, PermissionStatus } from '../../services/media-capture.service';

export type CaptureMode = 'image' | 'video' | 'audio';

@Component({
  selector: 'app-media-capture-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './media-capture-modal.component.html',
  styleUrls: ['./media-capture-modal.component.scss']
})
export class MediaCaptureModalComponent implements OnInit, OnDestroy {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  @Input() visible: boolean = false;
  @Input() mode: CaptureMode = 'image';
  @Output() onCapture = new EventEmitter<MediaCaptureResult>();
  @Output() onCancel = new EventEmitter<void>();

  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('audioElement') audioElement!: ElementRef<HTMLAudioElement>;
  @ViewChild('previewVideo') previewVideo!: ElementRef<HTMLVideoElement>;
  @ViewChild('previewAudio') previewAudio!: ElementRef<HTMLAudioElement>;

  // State management
  isLoading = false;
  hasPermission = false;
  permissionMessage = '';
  isRecording = false;
  isPaused = false;
  recordingTime = 0;
  showPreview = false;
  capturedResult: MediaCaptureResult | null = null;

  // Feature support
  supportsMediaRecorder = false;
  supportsPauseResume = false;
  isIOS = false;
  isAndroid = false;

  // Timer
  private recordingTimer: any;
  private stream: MediaStream | null = null;

  constructor(private mediaCaptureService: MediaCaptureService) {
    // Platform detection
    const ua = navigator.userAgent.toLowerCase();
    this.isIOS = /iphone|ipad|ipod/.test(ua);
    this.isAndroid = /android/.test(ua);

    // Feature detection
    this.supportsMediaRecorder = typeof window !== 'undefined' && 'MediaRecorder' in window;
    this.supportsPauseResume = this.supportsMediaRecorder && !!(window.MediaRecorder && MediaRecorder.prototype.pause);
  }

  ngOnInit() {
    if (this.visible) {
      this.initializeCapture();
    }
  }

  ngOnDestroy() {
    this.cleanup();
  }

  ngOnChanges() {
    if (this.visible) {
      this.initializeCapture();
    } else {
      this.cleanup();
    }
  }

  /**
   * Initialize capture based on mode
   */
  /**
   * Trigger native file input capture (fallback for unsupported browsers)
   */
  triggerNativeCapture() {
    if (this.fileInput?.nativeElement) {
      this.fileInput.nativeElement.value = '';
      this.fileInput.nativeElement.click();
    }
  }

  /**
   * Handle file input selection (native fallback)
   */
  handleFileInput(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const url = URL.createObjectURL(file);
      const result: MediaCaptureResult = {
        type: this.mode,
        blob: file,
        url,
        path: file.name
      };
      this.capturedResult = result;
      this.showPreview = true;
      this.hasPermission = true;
      this.isLoading = false;
      // Optionally auto-save or let user review/retake
    }
  }

  async initializeCapture() {
    this.isLoading = true;
    this.hasPermission = false;
    this.showPreview = false;
    this.capturedResult = null;

    // Robust feature detection before anything else
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      this.permissionMessage = 'Your browser does not support camera/microphone access. Please use a modern browser.';
      this.isLoading = false;
      return;
    }
    if ((this.mode === 'audio' || this.mode === 'video') && !this.supportsMediaRecorder) {
      this.permissionMessage = `Your browser does not support ${this.mode} recording. Please use a modern browser.`;
      this.isLoading = false;
      return;
    }

    try {
      // Check permissions
      const needsCamera = this.mode === 'image' || this.mode === 'video';
      const needsMicrophone = this.mode === 'audio' || this.mode === 'video';

      const permissionStatus: PermissionStatus = await this.mediaCaptureService.checkPermissions(
        needsCamera,
        needsMicrophone
      );

      if (!permissionStatus.granted) {
        this.permissionMessage = permissionStatus.message || 'Permission denied';
        this.isLoading = false;
        return;
      }

      // Start appropriate stream
      if (this.mode === 'image' || this.mode === 'video') {
        this.stream = await this.mediaCaptureService.startCameraStream(this.mode === 'video');
        // Wait for ViewChild to be ready
        setTimeout(() => {
          if (this.videoElement?.nativeElement) {
            this.videoElement.nativeElement.srcObject = this.stream;
          }
        });
      } else if (this.mode === 'audio') {
        this.stream = await this.mediaCaptureService.startAudioStream();
      }

      this.hasPermission = true;
      this.isLoading = false;
    } catch (error: any) {
      console.error('Failed to initialize capture:', error);
      this.permissionMessage = error?.message
        ? `Failed to access camera/microphone: ${error.message}`
        : 'Failed to access camera/microphone. Please check your permissions.';
      this.isLoading = false;
    }
  }

  /**
   * Capture image
   */
  async captureImage() {
    if (!this.videoElement?.nativeElement) return;

    try {
      this.isLoading = true;
      const result = await this.mediaCaptureService.captureImage(this.videoElement.nativeElement);
      this.capturedResult = result;
      this.showPreview = true;
      this.isLoading = false;
      
      console.log('Image captured:', result.path);
    } catch (error) {
      console.error('Failed to capture image:', error);
      this.isLoading = false;
    }
  }

  /**
   * Start recording (video or audio)
   */
  async startRecording() {
    if (!this.stream) return;

    try {
      this.isRecording = true;
      this.recordingTime = 0;
      this.startTimer();

      if (this.mode === 'video') {
        await this.mediaCaptureService.startVideoRecording(this.stream);
      } else if (this.mode === 'audio') {
        await this.mediaCaptureService.startAudioRecording(this.stream);
      }
    } catch (error) {
      console.error('Failed to start recording:', error);
      this.isRecording = false;
      this.stopTimer();
    }
  }

  /**
   * Pause recording
   */
  pauseRecording() {
    this.mediaCaptureService.pauseRecording();
    this.isPaused = true;
    this.stopTimer();
  }

  /**
   * Resume recording
   */
  resumeRecording() {
    this.mediaCaptureService.resumeRecording();
    this.isPaused = false;
    this.startTimer();
  }

  /**
   * Stop recording
   */
  async stopRecording() {
    if (!this.isRecording) return;

    try {
      this.isLoading = true;
      this.isRecording = false;
      this.isPaused = false;
      this.stopTimer();

      const result = await this.mediaCaptureService.stopRecording(this.mode as 'video' | 'audio');
      this.capturedResult = result;
      this.showPreview = true;
      this.isLoading = false;

      // Set up preview
      if (this.mode === 'video' && this.previewVideo?.nativeElement) {
        this.previewVideo.nativeElement.src = result.url;
      } else if (this.mode === 'audio' && this.previewAudio?.nativeElement) {
        this.previewAudio.nativeElement.src = result.url;
      }

      console.log(`${this.mode} recorded:`, result.path);
    } catch (error) {
      console.error('Failed to stop recording:', error);
      this.isLoading = false;
      this.isRecording = false;
      this.stopTimer();
    }
  }

  /**
   * Retake capture
   */
  retake() {
    this.showPreview = false;
    // Clean up preview URLs before nulling capturedResult
    if (this.capturedResult && this.capturedResult.url) {
      URL.revokeObjectURL(this.capturedResult.url);
    }
    this.capturedResult = null;
    this.isRecording = false;
    this.isPaused = false;
    this.recordingTime = 0;
    this.stopTimer();

    // Re-initialize media capture to show live preview again
    this.initializeCapture();
  }

  /**
   * Save and emit result
   */
  save() {
    if (this.capturedResult) {
      this.onCapture.emit(this.capturedResult);
      this.close();
    }
  }

  /**
   * Cancel and close modal
   */
  cancel() {
    this.onCancel.emit();
    this.close();
  }

  /**
   * Close modal and cleanup
   */
  private close() {
    this.cleanup();
    this.visible = false;
  }

  /**
   * Start recording timer
   */
  private startTimer() {
    this.recordingTimer = setInterval(() => {
      this.recordingTime++;
    }, 1000);
  }

  /**
   * Stop recording timer
   */
  private stopTimer() {
    if (this.recordingTimer) {
      clearInterval(this.recordingTimer);
      this.recordingTimer = null;
    }
  }

  /**
   * Format recording time for display
   */
  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Cleanup resources
   */
  private cleanup() {
    this.mediaCaptureService.stopAllStreams();
    this.stopTimer();
    
    if (this.capturedResult && this.capturedResult.url) {
      URL.revokeObjectURL(this.capturedResult.url);
    }
    
    this.stream = null;
    this.isRecording = false;
    this.isPaused = false;
    this.recordingTime = 0;
    this.showPreview = false;
    this.capturedResult = null;
  }

  /**
   * Get modal title based on mode
   */
  get modalTitle(): string {
    switch (this.mode) {
      case 'image': return 'Capture Image';
      case 'video': return 'Record Video';
      case 'audio': return 'Record Audio';
      default: return 'Media Capture';
    }
  }

  /**
   * Check if we can show camera preview
   */
  get showCameraPreview(): boolean {
    return this.hasPermission && !this.showPreview && (this.mode === 'image' || this.mode === 'video');
  }

  /**
   * Check if we can show audio recording interface
   */
  get showAudioInterface(): boolean {
    return this.hasPermission && !this.showPreview && this.mode === 'audio';
  }
}
