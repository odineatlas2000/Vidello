document.addEventListener('DOMContentLoaded', function() {
    const videoUrlInput = document.getElementById('videoUrl');
    const downloadBtn = document.getElementById('downloadBtn');
    const btnText = document.getElementById('btnText');
    const spinner = document.getElementById('spinner');
    const resultsModal = document.getElementById('resultsModal');
    const closeModal = document.getElementById('closeModal');
    const videoTitle = document.getElementById('videoTitle');
    const videoDuration = document.getElementById('videoDuration');
    const videoThumbnail = document.getElementById('videoThumbnail');
    
    // Add click handler for logo to navigate to home page
    const logoDiv = document.querySelector('.flex.items-center.space-x-2');
    if (logoDiv) {
        logoDiv.style.cursor = 'pointer';
        logoDiv.addEventListener('click', function() {
            window.location.href = '/';
        });
    }
    
    // Create toast container if it doesn't exist
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'fixed bottom-4 right-4 z-50';
        document.body.appendChild(toastContainer);
    }
    
    // Function to show toast notifications
    function showToastNotification(message, type = 'info', duration = 5000) {
        const toast = document.createElement('div');
        toast.className = 'mb-3 p-4 rounded-lg shadow-lg transform transition-all duration-300 ease-in-out';
        
        // Set background color based on notification type
        if (type === 'info') {
            toast.classList.add('bg-blue-500', 'text-white');
        } else if (type === 'success') {
            toast.classList.add('bg-green-500', 'text-white');
        } else if (type === 'error') {
            toast.classList.add('bg-red-500', 'text-white');
        } else if (type === 'warning') {
            toast.classList.add('bg-yellow-500', 'text-white');
        }
        
        toast.innerHTML = `
            <div class="flex items-center">
                <div class="flex-grow">${message}</div>
                <button class="ml-4 text-white focus:outline-none">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                    </svg>
                </button>
            </div>
        `;
        
        // Add to container
        toastContainer.appendChild(toast);
        
        // Add close button functionality
        const closeButton = toast.querySelector('button');
        closeButton.addEventListener('click', () => {
            toast.classList.add('opacity-0', '-translate-y-2');
            setTimeout(() => {
                toastContainer.removeChild(toast);
            }, 300);
        });
        
        // Auto remove after duration
        setTimeout(() => {
            if (toastContainer.contains(toast)) {
                toast.classList.add('opacity-0', '-translate-y-2');
                setTimeout(() => {
                    if (toastContainer.contains(toast)) {
                        toastContainer.removeChild(toast);
                    }
                }, 300);
            }
        }, duration);
        
        // Animate in
        setTimeout(() => {
            toast.classList.add('translate-y-0');
        }, 10);
    }
    
    // API endpoint (your backend server)
    // Dynamically determine the API URL based on the current window location
    const API_URL = `${window.location.protocol}//${window.location.hostname}${window.location.port ? `:${window.location.port}` : ''}/api`;
    
    // Show loading state
    function showLoading() {
        btnText.textContent = 'Processing...';
        spinner.classList.remove('hidden');
        downloadBtn.disabled = true;
    }
    
    // Hide loading state
    function hideLoading() {
        btnText.textContent = 'Download Video';
        spinner.classList.add('hidden');
        downloadBtn.disabled = false;
    }
    
    // Format seconds to MM:SS
    function formatDuration(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    // Handle download button click
    downloadBtn.addEventListener('click', async function() {
        const videoUrl = videoUrlInput.value.trim();
        
        if (!videoUrl) {
            showToastNotification('Please enter a valid video URL', 'warning');
            return;
        }
        
        showLoading();
        
        try {
            // Fetch video info from backend
            const response = await fetch(`${API_URL}/video-info?url=${encodeURIComponent(videoUrl)}`);
            
            if (!response.ok) {
                // Try to get the detailed error message from the response
                const errorData = await response.json().catch(() => ({}));
                
                if (response.status === 403 && errorData.error && errorData.error.includes('TikTok has blocked')) {
                    throw new Error('TikTok has blocked the server IP address');
                } else if (response.status === 400 && errorData.error && errorData.error.includes('photo URLs are not supported')) {
                    throw new Error('TikTok photo URLs are not supported. Please provide a TikTok video URL instead.');
                } else if (errorData.error) {
                    throw new Error(errorData.error);
                } else {
                    throw new Error('Failed to fetch video info');
                }
            }
            
            const data = await response.json();
            
            // Show modal with video info
            resultsModal.classList.remove('hidden');
            
            // Update modal with video info
            if (data.platform === 'youtube') {
                videoTitle.textContent = data.title;
                videoDuration.textContent = formatDuration(data.duration);
                videoThumbnail.src = data.thumbnail;
                
                // Clear previous download options
                const downloadOptionsContainer = document.querySelector('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3.gap-3.max-h-96.overflow-y-auto');
                downloadOptionsContainer.innerHTML = '';
                
                // Add download options based on available formats
                const formats = [
                    { label: 'MP4', quality: '2160p (4K)', format: 'mp4', qualityParam: '2160' },
                    { label: 'MP4', quality: '1440p (2K)', format: 'mp4', qualityParam: '1440' },
                    { label: 'MP4', quality: '1080p (Full HD)', format: 'mp4', qualityParam: '1080' },
                    { label: 'MP4', quality: '720p (HD)', format: 'mp4', qualityParam: '720' },
                    { label: 'MP4', quality: '480p', format: 'mp4', qualityParam: '480' },
                    { label: 'MP4', quality: '360p', format: 'mp4', qualityParam: '360' },
                    { label: 'MP4', quality: 'Best Available', format: 'mp4', qualityParam: 'highest' },
                    { label: 'MP3', quality: 'Audio Only', format: 'audio', qualityParam: 'highestaudio' }
                ];
                
                formats.forEach(format => {
                    const formatElement = document.createElement('div');
                    formatElement.className = 'border rounded-lg p-3 hover:bg-blue-50 cursor-pointer transition-colors';
                
                    formatElement.innerHTML = `
                        <div class="flex justify-between items-center">
                            <div>
                                <p class="font-medium">${format.label}</p>
                                <p class="text-sm text-gray-500">${format.quality}</p>
                            </div>
                            <button class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors download-option" 
                                    data-url="${videoUrl}" 
                                    data-format="${format.format}" 
                                    data-quality="${format.qualityParam}">Download</button>
                        </div>
                    `;
                    
                    // Add click event to the download button
                    const downloadButton = formatElement.querySelector('.download-option');
                    downloadButton.addEventListener('click', function() {
                        const videoUrl = this.getAttribute('data-url');
                        const format = this.getAttribute('data-format');
                        const quality = this.getAttribute('data-quality');
                        
                        // Create download URL with query parameters
                        const downloadUrl = `${API_URL}/download?url=${encodeURIComponent(videoUrl)}&format=${format}&quality=${quality}`;
                        
                        // Show download status to user
                        const originalText = this.textContent;
                        this.textContent = 'Downloading...';
                        this.disabled = true;
                        
                        // Create a hidden iframe for download instead of opening a new tab
                        const downloadFrame = document.createElement('iframe');
                        downloadFrame.style.display = 'none';
                        document.body.appendChild(downloadFrame);
                        
                        // Set a timeout to update the button text if download takes longer than expected
                        const downloadTimeout = setTimeout(() => {
                            this.textContent = 'Downloading in background...';
                            this.disabled = true;
                            // Show a more informative message with a toast notification instead of an alert
                            showToastNotification('Download is continuing in the background. Please wait...', 'info');
                        }, 30000); // 30 seconds timeout
                        
                        // Start the download
                        downloadFrame.src = downloadUrl;
                        
                        // Listen for the iframe load event
                        downloadFrame.onload = function() {
                            clearTimeout(downloadTimeout);
                            const button = document.querySelector(`[data-url="${videoUrl}"][data-format="${format}"][data-quality="${quality}"]`);
                            if (button) {
                                button.textContent = originalText;
                                button.disabled = false;
                            }
                            // Show success notification
                            showToastNotification('Download completed successfully!', 'success');
                            // Remove the iframe after a short delay
                            setTimeout(() => {
                                document.body.removeChild(downloadFrame);
                            }, 1000);
                        };
                    });
                    
                    downloadOptionsContainer.appendChild(formatElement);
                });
            } else if (data.platform === 'tiktok') {
                // Handle TikTok with proper format
                videoTitle.textContent = data.title || 'TikTok Video';
                videoDuration.textContent = typeof data.duration === 'number' ? formatDuration(data.duration) : '00:00';
                videoThumbnail.src = data.thumbnail || 'https://via.placeholder.com/480x852?text=TikTok+Video';
                
                // Clear previous download options
                const downloadOptionsContainer = document.querySelector('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3.gap-3.max-h-96.overflow-y-auto');
                if (downloadOptionsContainer) {
                    downloadOptionsContainer.innerHTML = '';
                } else {
                    console.error('Download options container not found');
                    return;
                }
                
                // Add download options for TikTok
                const formats = [
                    { label: 'MP4', quality: 'Original Quality (No Watermark)', format: 'mp4' },
                    { label: 'MP3', quality: 'Audio Only', format: 'audio' }
                ];
                
                formats.forEach(format => {
                    const formatElement = document.createElement('div');
                    formatElement.className = 'border rounded-lg p-4 hover:bg-blue-50 cursor-pointer transition-colors';
                
                    formatElement.innerHTML = `
                        <div class="flex justify-between items-center">
                            <div>
                                <p class="font-medium">${format.label}</p>
                                <p class="text-sm text-gray-500">${format.quality}</p>
                            </div>
                            <button class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors download-option" 
                                    data-url="${videoUrl}" 
                                    data-format="${format.format}">Download</button>
                        </div>
                    `;
                    
                    // Add click event to the download button
                    const downloadButton = formatElement.querySelector('.download-option');
                    downloadButton.addEventListener('click', function() {
                        const videoUrl = this.getAttribute('data-url');
                        const format = this.getAttribute('data-format');
                        
                        // Create download URL with query parameters
                        const downloadUrl = `${API_URL}/download?url=${encodeURIComponent(videoUrl)}&format=${format}`;
                        
                        // Show download status to user
                        const originalText = this.textContent;
                        this.textContent = 'Downloading...';
                        this.disabled = true;
                        
                        // Create a hidden iframe for download instead of opening a new tab
                        const downloadFrame = document.createElement('iframe');
                        downloadFrame.style.display = 'none';
                        document.body.appendChild(downloadFrame);
                        
                        // Set a timeout to update the button text if download takes longer than expected
                        const downloadTimeout = setTimeout(() => {
                            this.textContent = 'Downloading in background...';
                            this.disabled = true;
                            // Show a more informative message with a toast notification instead of an alert
                            showToastNotification('Download is continuing in the background. Please wait...', 'info');
                        }, 30000); // 30 seconds timeout
                        
                        // Start the download
                        downloadFrame.src = downloadUrl;
                        
                        // Listen for the iframe load event
                        downloadFrame.onload = function() {
                            clearTimeout(downloadTimeout);
                            const button = document.querySelector(`[data-url="${videoUrl}"][data-format="${format}"]`);
                            if (button) {
                                button.textContent = originalText;
                                button.disabled = false;
                            }
                            // Show success notification
                            showToastNotification('Download completed successfully!', 'success');
                            // Remove the iframe after a short delay
                            setTimeout(() => {
                                document.body.removeChild(downloadFrame);
                            }, 1000);
                        };
                    });
                    
                    downloadOptionsContainer.appendChild(formatElement);
                });
            } else if (data.platform === 'instagram') {
                // Handle Instagram differently as they have different response structures
                videoTitle.textContent = data.title || 'Instagram Video';
                videoDuration.textContent = typeof data.duration === 'number' ? formatDuration(data.duration) : data.duration || '00:00';
                videoThumbnail.src = data.thumbnail || data.thumbnail_url || 'https://via.placeholder.com/480x480?text=Instagram+Video';
                
                // Clear previous download options
            const downloadOptionsContainer = document.querySelector('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3.gap-3.max-h-96.overflow-y-auto');
            if (downloadOptionsContainer) {
                downloadOptionsContainer.innerHTML = '';
            } else {
                console.error('Download options container not found');
                return;
            }
                
                // Add download options for Instagram
                const formats = [
                    { label: 'MP4', quality: 'Original Quality', format: 'mp4' },
                    { label: 'MP3', quality: 'Audio Only', format: 'audio' }
                ];
                
                formats.forEach(format => {
                    const formatElement = document.createElement('div');
                    formatElement.className = 'border rounded-lg p-4 hover:bg-blue-50 cursor-pointer transition-colors';
                
                    formatElement.innerHTML = `
                        <div class="flex justify-between items-center">
                            <div>
                                <p class="font-medium">${format.label}</p>
                                <p class="text-sm text-gray-500">${format.quality}</p>
                            </div>
                            <button class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors download-option" 
                                    data-url="${videoUrl}" 
                                    data-format="${format.format}">Download</button>
                        </div>
                    `;
                
                    // Add click event to the download button
                    const downloadButton = formatElement.querySelector('.download-option');
                    downloadButton.addEventListener('click', function() {
                        const videoUrl = this.getAttribute('data-url');
                        const format = this.getAttribute('data-format');
                        
                        // Create download URL with query parameters
                        const downloadUrl = `${API_URL}/download?url=${encodeURIComponent(videoUrl)}&format=${format}`;
                        
                        // Show download status to user
                        const originalText = this.textContent;
                        this.textContent = 'Downloading...';
                        this.disabled = true;
                        
                        // Create a hidden iframe for download instead of opening a new tab
                        const downloadFrame = document.createElement('iframe');
                        downloadFrame.style.display = 'none';
                        document.body.appendChild(downloadFrame);
                        
                        // Set a timeout to update the button text if download takes longer than expected
                        const downloadTimeout = setTimeout(() => {
                            this.textContent = 'Downloading in background...';
                            this.disabled = true;
                            // Show a more informative message with a toast notification instead of an alert
                            showToastNotification('Download is continuing in the background. Please wait...', 'info');
                        }, 30000); // 30 seconds timeout
                        
                        // Start the download
                        downloadFrame.src = downloadUrl;
                        
                        // Listen for the iframe load event
                        downloadFrame.onload = function() {
                            clearTimeout(downloadTimeout);
                            const button = document.querySelector(`[data-url="${videoUrl}"][data-format="${format}"]`);
                            if (button) {
                                button.textContent = originalText;
                                button.disabled = false;
                            }
                            // Show success notification
                            showToastNotification('Download completed successfully!', 'success');
                            // Remove the iframe after a short delay
                            setTimeout(() => {
                                document.body.removeChild(downloadFrame);
                            }, 1000);
                        };
                    });
                    
                    downloadOptionsContainer.appendChild(formatElement);
                });
            } else if (data.platform === 'facebook') {
                // Handle Facebook videos
                videoTitle.textContent = data.title || 'Facebook Video';
                videoDuration.textContent = typeof data.duration === 'number' ? formatDuration(data.duration) : data.duration || '00:00';
                videoThumbnail.src = data.thumbnail || 'https://via.placeholder.com/480x360?text=Facebook+Video';
                
                // Clear previous download options
            const downloadOptionsContainer = document.querySelector('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3.gap-3.max-h-96.overflow-y-auto');
            if (downloadOptionsContainer) {
                downloadOptionsContainer.innerHTML = '';
            } else {
                console.error('Download options container not found');
                return;
            }
                
                // Add download options for Facebook
                const formats = [
                    { label: 'MP4', quality: 'Original Quality', format: 'mp4' },
                    { label: 'MP3', quality: 'Audio Only', format: 'audio' }
                ];
                
                formats.forEach(format => {
                    const formatElement = document.createElement('div');
                    formatElement.className = 'border rounded-lg p-4 hover:bg-blue-50 cursor-pointer transition-colors';
                
                    formatElement.innerHTML = `
                        <div class="flex justify-between items-center">
                            <div>
                                <p class="font-medium">${format.label}</p>
                                <p class="text-sm text-gray-500">${format.quality}</p>
                            </div>
                            <button class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors download-option" 
                                    data-url="${videoUrl}" 
                                    data-format="${format.format}">Download</button>
                        </div>
                    `;
                
                    // Add click event to the download button
                    const downloadButton = formatElement.querySelector('.download-option');
                    downloadButton.addEventListener('click', function() {
                        const videoUrl = this.getAttribute('data-url');
                        const format = this.getAttribute('data-format');
                        
                        // Create download URL with query parameters
                        const downloadUrl = `${API_URL}/download?url=${encodeURIComponent(videoUrl)}&format=${format}`;
                        
                        // Show download status to user
                        const originalText = this.textContent;
                        this.textContent = 'Downloading...';
                        this.disabled = true;
                        
                        // Create a hidden iframe for download instead of opening a new tab
                        const downloadFrame = document.createElement('iframe');
                        downloadFrame.style.display = 'none';
                        document.body.appendChild(downloadFrame);
                        
                        // Set a timeout to update the button text if download takes longer than expected
                        const downloadTimeout = setTimeout(() => {
                            this.textContent = 'Downloading in background...';
                            this.disabled = true;
                            // Show a more informative message with a toast notification instead of an alert
                            showToastNotification('Download is continuing in the background. Please wait...', 'info');
                        }, 30000); // 30 seconds timeout
                        
                        // Start the download
                        downloadFrame.src = downloadUrl;
                        
                        // Listen for the iframe load event
                        downloadFrame.onload = function() {
                            clearTimeout(downloadTimeout);
                            const button = document.querySelector(`[data-url="${videoUrl}"][data-format="${format}"]`);
                            if (button) {
                                button.textContent = originalText;
                                button.disabled = false;
                            }
                            // Show success notification
                            showToastNotification('Download completed successfully!', 'success');
                            // Remove the iframe after a short delay
                            setTimeout(() => {
                                document.body.removeChild(downloadFrame);
                            }, 1000);
                        };
                    });
                    
                    downloadOptionsContainer.appendChild(formatElement);
                });
            } else {
                // Generic fallback for other platforms (Pinterest, Twitter, Vimeo, etc.)
                videoTitle.textContent = data.title || 'Video';
                videoDuration.textContent = typeof data.duration === 'number' ? formatDuration(data.duration) : data.duration || '00:00';
                videoThumbnail.src = data.thumbnail || 'https://via.placeholder.com/480x360?text=Video';
                
                // Clear previous download options
                const downloadOptionsContainer = document.querySelector('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3.gap-3.max-h-96.overflow-y-auto');
                if (downloadOptionsContainer) {
                    downloadOptionsContainer.innerHTML = '';
                } else {
                    console.error('Download options container not found');
                    return;
                }
                
                // Add generic download options
                const formats = [
                    { label: 'MP4', quality: 'Best Available Video', format: 'mp4' },
                    { label: 'MP3', quality: 'Audio Only', format: 'audio' }
                ];
                
                formats.forEach(format => {
                    const formatElement = document.createElement('div');
                    formatElement.className = 'border rounded-lg p-4 hover:bg-blue-50 cursor-pointer transition-colors';
                
                    formatElement.innerHTML = `
                        <div class="flex justify-between items-center">
                            <div>
                                <p class="font-medium">${format.label}</p>
                                <p class="text-sm text-gray-500">${format.quality}</p>
                            </div>
                            <button class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors download-option" 
                                    data-url="${videoUrl}" 
                                    data-format="${format.format}">Download</button>
                        </div>
                    `;
                
                    // Add click event to the download button
                    const downloadButton = formatElement.querySelector('.download-option');
                    downloadButton.addEventListener('click', function() {
                        const videoUrl = this.getAttribute('data-url');
                        const format = this.getAttribute('data-format');
                        
                        // Create download URL with query parameters
                        const downloadUrl = `${API_URL}/download?url=${encodeURIComponent(videoUrl)}&format=${format}`;
                        
                        // Show download status to user
                        const originalText = this.textContent;
                        this.textContent = 'Downloading...';
                        this.disabled = true;
                        
                        // Create a hidden iframe for download instead of opening a new tab
                        const downloadFrame = document.createElement('iframe');
                        downloadFrame.style.display = 'none';
                        document.body.appendChild(downloadFrame);
                        
                        // Set a timeout to update the button text if download takes longer than expected
                        const downloadTimeout = setTimeout(() => {
                            this.textContent = 'Downloading in background...';
                            this.disabled = true;
                            // Show a more informative message with a toast notification instead of an alert
                            showToastNotification('Download is continuing in the background. Please wait...', 'info');
                        }, 30000); // 30 seconds timeout
                        
                        // Start the download
                        downloadFrame.src = downloadUrl;
                        
                        // Listen for the iframe load event
                        downloadFrame.onload = function() {
                            clearTimeout(downloadTimeout);
                            const button = document.querySelector(`[data-url="${videoUrl}"][data-format="${format}"]`);
                            if (button) {
                                button.textContent = originalText;
                                button.disabled = false;
                            }
                            // Show success notification
                            showToastNotification('Download completed successfully!', 'success');
                            // Remove the iframe after a short delay
                            setTimeout(() => {
                                document.body.removeChild(downloadFrame);
                            }, 1000);
                        };
                    });
                    
                    downloadOptionsContainer.appendChild(formatElement);
                });
            }
        } catch (error) {
            console.error('Error:', error);
            
            // Check if the error is related to TikTok IP blocking
            if (error.message && error.message.includes('TikTok has blocked')) {
                showToastNotification('TikTok has blocked the server IP address. This is a common issue with TikTok downloads. Please try again later or use a different approach.', 'warning', 10000);
            } 
            // Check if the error is related to TikTok photo URLs
            else if (error.message && error.message.includes('TikTok photo URLs are not supported')) {
                showToastNotification('TikTok photo URLs are not supported. Please provide a TikTok video URL instead.', 'warning', 8000);
            }
            // Check if the error is related to Instagram authentication
            else if (error.message && error.message.includes('Instagram authentication required')) {
                showToastNotification('Instagram authentication required. This content requires login credentials to access. The downloader needs to be configured with Instagram cookies.', 'warning', 10000);
            }
            // Check if the error is related to Facebook authentication
            else if (error.message && error.message.includes('Facebook authentication required')) {
                showToastNotification('Facebook authentication required. This content requires login credentials to access. The downloader needs to be configured with Facebook cookies.', 'warning', 10000);
            }
            // Check if the error is related to Facebook IP blocking
            else if (error.message && error.message.includes('Facebook has blocked')) {
                showToastNotification('Facebook has blocked the server IP address. This is a common issue with Facebook downloads. Please try again later or use a different approach.', 'warning', 10000);
            }
            // Check if the error is related to Facebook video not found or inaccessible
            else if (error.message && error.message.includes('Facebook video not found or inaccessible')) {
                showToastNotification('The Facebook video could not be found or is not accessible. It may have been removed, set to private, or requires authentication.', 'warning', 8000);
            } else {
                showToastNotification(`Error: ${error.message}`, 'error');
            }
        } finally {
            hideLoading();
        }
    });
    
    // Close modal when clicking the close button
    if (closeModal) {
        closeModal.addEventListener('click', function() {
            resultsModal.classList.add('hidden');
        });
    }
    
    // Close modal when clicking outside of it
    window.addEventListener('click', function(event) {
        if (event.target === resultsModal) {
            resultsModal.classList.add('hidden');
        }
    });
});
