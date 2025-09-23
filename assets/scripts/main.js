// App State
let currentView = 'welcome';
let idleTimer = null;
let timeoutTimer = null;
let timeLeft = 30;
let timeoutTimeline = null;
let userInteracted = false; // Track if user has interacted (for Android video autoplay)
let currentPlayingVideo = null; // Track which video is currently playing
let modalJustOpened = false; // Track if modal was just opened to prevent auto-play

// Session Management
let currentSession = null;
let sessionStartTime = null;

// Timeout DOM Elements (cached for performance)
let timeoutOverlay = null;
let timeoutCard = null;
let timerCircle = null;
let progressCircle = null;
let timerNumber = null;

// Modal DOM Elements (cached for performance)
let walkthroughModal = null;
let demosBusinessModal = null;
let demosTechModal = null;
let brochureModal = null;
let hfsModal = null;
let formModal = null;

// Quiz DOM Elements (cached for performance)
let currentQuizView = null;

// Form DOM Elements (cached for performance)
let contactForm = null;
let formContainer = null;
let formThanks = null;

// View Management
function showView(viewId) {
	// Hide all views
	document.querySelectorAll('.view').forEach(view => {
		view.classList.remove('active');
	});

	// Show target view
	document.getElementById(viewId).classList.add('active');

	currentView = viewId;
	
	// Reset idle timer (will only start if not on welcome screen)
	resetIdleTimer();

	// Clear any persistent :active states on touch devices
	clearActiveStates();

	// Initialize quiz if needed
	if (viewId === 'businessQuiz') {
		initQuiz('business');
	} else if (viewId === 'technicalQuiz') {
		initQuiz('technical');
	}
}

// Function to clear persistent :active states
function clearActiveStates() {
	// Clear focus to reset any stuck states
	document.activeElement?.blur();
	
	// Force a reflow to clear any stuck :active states
	document.querySelectorAll('.btn, .card, .path-card, .dashboard-card').forEach(element => {
		// Reset any inline styles that might be stuck
		element.style.transform = '';
		element.style.borderColor = '';
		element.style.boxShadow = '';
		element.style.opacity = '';
		
		// Reset any child elements that might have transforms
		const childElements = element.querySelectorAll('svg, .row-icon svg');
		childElements.forEach(child => {
			child.style.transform = '';
			child.style.opacity = '';
		});
		
		// Trigger a reflow
		element.offsetHeight;
	});
}

// Quiz State Management
const quizState = {
	currentQuestion: 0,
	answers: {},
	totalQuestions: 0,
	quizType: null
};

// Quiz Functions
function initQuiz(quizType) {
	quizState.currentQuestion = 0;
	quizState.answers = {};
	quizState.quizType = quizType;
	
	// Cache the current quiz view
	currentQuizView = document.getElementById(quizType === 'business' ? 'businessQuiz' : 'technicalQuiz');
	
	// Get total questions from HTML
	quizState.totalQuestions = currentQuizView.querySelectorAll('.question').length;
	
	// Reset quiz to initial state
	resetQuizView(currentQuizView);
	updateProgressBar(currentQuizView, 0);
	updateNavigationButtons(currentQuizView, 0);
	
	// Track quiz start
	trackEvent('quiz_started', { quiz_type: quizType });
}

function resetQuiz() {
	if (quizState.quizType) {
		initQuiz(quizState.quizType);
	}
}

function resetQuizView(quizView) {
	// Hide results, show content
	const quizContent = quizView.querySelector('.quiz-content');
	const quizResults = quizView.querySelector('.quiz-results');
	
	quizContent.classList.add('active');
	quizResults.classList.remove('active');
	
	// Reset progress bar opacity
	const progressBar = quizView.querySelector('.quiz-progress');
	progressBar.style.transition = 'opacity 0.3s ease-in';
	progressBar.style.opacity = '1';
	
	// Reset all questions to inactive
	const questions = quizView.querySelectorAll('.question');
	questions.forEach((question, index) => {
		question.classList.remove('active');
		if (index === 0) {
			question.classList.add('active');
		}
	});
	
	// Clear all answer selections
	const answers = quizView.querySelectorAll('.answer');
	answers.forEach(answer => {
		answer.classList.remove('selected');
	});
}

function selectAnswer(element) {
	const questionDiv = element.closest('.question');
	const questionIndex = parseInt(questionDiv.dataset.question);
	
	// Remove previous selection for this question
	questionDiv.querySelectorAll('.answer').forEach(answer => {
		answer.classList.remove('selected');
	});
	
	// Select this answer
	element.classList.add('selected');
	
	// Store the answer
	const weight = parseInt(element.dataset.weight);
	quizState.answers[questionIndex] = weight;
	
	// Track answer selection
	trackEvent('quiz_answer_selected', { 
		quiz_type: quizState.quizType,
		question: questionIndex + 1,
		answer_weight: weight
	});
}

function nextQuestion() {
	// Check if we have an answer for current question
	if (quizState.answers[quizState.currentQuestion] === undefined) {
		// Visual feedback for missing answer
		const currentQuestion = currentQuizView.querySelector('.question.active');
		const answers = currentQuestion.querySelectorAll('.answer');
		answers.forEach(answer => {
			answer.style.animation = 'none';
			setTimeout(() => {
				answer.style.animation = 'shake 0.2s ease-in-out';
			}, 10);
		});
		return; // Don't proceed without an answer
	}
	
	// If this is the last question, show results
	if (quizState.currentQuestion >= quizState.totalQuestions - 1) {
		showQuizResults(currentQuizView);
		return;
	}
	
	// Move to next question
	quizState.currentQuestion++;
	updateQuestionDisplay(currentQuizView);
	updateProgressBar(currentQuizView, quizState.currentQuestion);
	updateNavigationButtons(currentQuizView, quizState.currentQuestion);
	
	// Track question navigation
	trackEvent('quiz_question_navigation', { 
		quiz_type: quizState.quizType,
		question: quizState.currentQuestion + 1,
		direction: 'next'
	});
}

function previousQuestion() {
	if (quizState.currentQuestion <= 0) return;
	
	// Move to previous question
	quizState.currentQuestion--;
	updateQuestionDisplay(currentQuizView);
	updateProgressBar(currentQuizView, quizState.currentQuestion);
	updateNavigationButtons(currentQuizView, quizState.currentQuestion);
	
	// Track question navigation
	trackEvent('quiz_question_navigation', { 
		quiz_type: quizState.quizType,
		question: quizState.currentQuestion + 1,
		direction: 'previous'
	});
}

function updateQuestionDisplay(quizView) {
	const questions = quizView.querySelectorAll('.question');
	questions.forEach((question, index) => {
		question.classList.remove('active');
		if (index === quizState.currentQuestion) {
			question.classList.add('active');
		}
	});
}

function updateProgressBar(quizView, currentQuestion) {
	const progressBar = quizView.querySelector('.quiz-progress-bar');
	// Calculate progress based on questions completed (not current question index)
	const questionsCompleted = currentQuestion + 1;
	const progress = (questionsCompleted / quizState.totalQuestions) * 100;
	progressBar.style.setProperty('--progress-width', `${progress}%`);
}

function updateNavigationButtons(quizView, currentQuestion) {
	const prevBtn = quizView.querySelector('.quiz-previous');
	const nextBtn = quizView.querySelector('.quiz-next');
	const nextBtnText = nextBtn.querySelector('span');
	
	// Show/hide previous button
	if (currentQuestion === 0) {
		prevBtn.style.display = 'none';
	} else {
		prevBtn.style.display = 'flex';
	}
	
	// Update next button text for last question
	if (currentQuestion >= quizState.totalQuestions - 1) {
		nextBtnText.textContent = 'See Results';
	} else {
		nextBtnText.textContent = 'Next';
	}
}

function showQuizResults(quizView) {
	// Calculate score
	let score = 0;
	for (let i = 0; i < quizState.totalQuestions; i++) {
		score += quizState.answers[i] || 0;
	}
	
	// Set progress bar to 100%
	updateProgressBar(quizView, quizState.totalQuestions - 1);
	
	// Fade out progress bar
	const progressBar = quizView.querySelector('.quiz-progress');
	progressBar.style.transition = 'opacity 0.5s ease-out';
	progressBar.style.opacity = '0';
	
	// Hide quiz content, show results
	const quizContent = quizView.querySelector('.quiz-content');
	const quizResults = quizView.querySelector('.quiz-results');
	
	quizContent.classList.remove('active');
	quizResults.classList.add('active');
	
	// Update result text
	updateResultText(quizView, score);
	
	// Animate score display
	animateScoreDisplay(quizView, score);
	
	// Track quiz completion
	trackEvent('quiz_completed', { 
		quiz_type: quizState.quizType,
		score: score,
		total_questions: quizState.totalQuestions,
		answers: quizState.answers
	});
}

function updateResultText(quizView, score) {
	const resultTexts = quizView.querySelectorAll('.result-text');
	resultTexts.forEach(text => {
		text.classList.remove('active');
		if (parseInt(text.dataset.result) === score) {
			text.classList.add('active');
		}
	});
}

function animateScoreDisplay(quizView, score) {
	const scoreNumber = quizView.querySelector('.score .number');
	const progressCircle = quizView.querySelector('.board-progress');
	
	// Animate the number
	let currentNumber = 0;
	const targetNumber = score;
	const duration = 1000; // 1 second
	const increment = targetNumber / (duration / 16); // 60fps
	
	const numberAnimation = setInterval(() => {
		currentNumber += increment;
		if (currentNumber >= targetNumber) {
			currentNumber = targetNumber;
			clearInterval(numberAnimation);
		}
		scoreNumber.textContent = Math.floor(currentNumber);
	}, 16);
	
	// Animate the progress circle
	const circumference = 2 * Math.PI * 230; // radius = 230
	const progress = (score / quizState.totalQuestions) * circumference;
	
	progressCircle.style.strokeDasharray = `${circumference} ${circumference}`;
	progressCircle.style.strokeDashoffset = circumference;
	
	// Animate the circle
	setTimeout(() => {
		progressCircle.style.transition = 'stroke-dashoffset 1s ease-in-out';
		progressCircle.style.strokeDashoffset = circumference - progress;
	}, 200);
	
}

// Initialize timeout DOM elements
function initTimeoutElements() {
	timeoutOverlay = document.getElementById('timeoutOverlay');
	timeoutCard = timeoutOverlay?.querySelector('.timeout-card');
	timerCircle = timeoutOverlay?.querySelector('.timer-circle');
	progressCircle = timeoutOverlay?.querySelector('.board-progress');
	timerNumber = timeoutOverlay?.querySelector('#timerCircle .number');
}

// Initialize modal DOM elements
function initModalElements() {
	walkthroughModal = document.getElementById('walkthroughOverlay');
	demosBusinessModal = document.getElementById('demosBusinessOverlay');
	demosTechModal = document.getElementById('demosTechOverlay');
	brochureModal = document.getElementById('brochureOverlay');
	hfsModal = document.getElementById('hfsOverlay');
	formModal = document.getElementById('formOverlay');
	
	// Initialize form elements
	if (formModal) {
		contactForm = formModal.querySelector('#contactForm');
		formContainer = formModal.querySelector('#formContainer');
		formThanks = formModal.querySelector('#formThanks');
	}
}

// Idle Timer Management
function resetIdleTimer() {
	clearTimeout(idleTimer);
	clearTimeout(timeoutTimer);
	
	// Initialize elements if not already done
	if (!timeoutOverlay) {
		initTimeoutElements();
	}
	
	timeoutOverlay?.classList.remove('active');
	timeLeft = 30;
	
	// Kill any existing timeline
	if (timeoutTimeline) {
		timeoutTimeline.kill();
		timeoutTimeline = null;
	}
	
	// Reset the progress circle to initial state
	resetProgressCircle();

	// Only start idle timer if not on welcome screen
	if (currentView !== 'welcome') {
		idleTimer = setTimeout(() => {
			timeoutOverlay?.classList.add('active');
			startCountdown();
		}, 30000); // 30 seconds
	}
}

// Stop idle timer completely (useful for welcome screen or other scenarios)
function stopIdleTimer() {
	clearTimeout(idleTimer);
	clearTimeout(timeoutTimer);
	
	// Kill any existing timeline
	if (timeoutTimeline) {
		timeoutTimeline.kill();
		timeoutTimeline = null;
	}
	
	// Hide timeout overlay if active
	timeoutOverlay?.classList.remove('active');
}

function resetProgressCircle() {
	if (!progressCircle) return;
	
	// Reset to initial state (no progress)
	const circumference = 2 * Math.PI * 230; // radius = 230
	progressCircle.style.strokeDasharray = `${circumference} ${circumference}`;
	
	// Animate reset with GSAP
	gsap.set(progressCircle, {
		strokeDashoffset: circumference
	});
}

function startCountdown() {
	timeLeft = 30;
	updateTimerDisplay();
	
	// Ensure elements are initialized
	if (!timeoutOverlay) {
		initTimeoutElements();
	}
	
	// Set initial states
	gsap.set(timeoutCard, { scale: 0.8, opacity: 0 });
	gsap.set(timerCircle, { scale: 0.9, opacity: 0 });
	gsap.set(progressCircle, { strokeDashoffset: 2 * Math.PI * 230 });
	
	// Calculate circumference
	const circumference = 2 * Math.PI * 230;
	
	// Create the main countdown timeline
	timeoutTimeline = gsap.timeline({
		onComplete: () => {
			// Track timeout and end session before refresh
			trackEvent('session_timeout', { session_id: currentSession });
			endCurrentSession();
			window.location.reload();
		}
	});
	
	// Animate entrance first
	timeoutTimeline
		.to(timeoutCard, { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(1.7)" })
		.to(timerCircle, { scale: 1, opacity: 1, duration: 0.3, ease: "power2.out" }, "-=0.2")
		// Start the 30-second countdown animation
		.to(progressCircle, { 
			strokeDashoffset: 0, 
			duration: 30, 
			ease: "none",
			onUpdate: function() {
				// Update timer display based on progress
				const progress = this.progress();
				timeLeft = Math.ceil(30 * (1 - progress));
				updateTimerDisplay();
			}
		}, "-=0.1");
}

function updateTimerDisplay() {
	if (timerNumber) {
		timerNumber.textContent = timeLeft;
	}
}

function resumeSession() {
	// Kill the timeline before animating exit
	if (timeoutTimeline) {
		timeoutTimeline.kill();
		timeoutTimeline = null;
	}
	
	animateTimeoutExit(() => {
		timeoutOverlay?.classList.remove('active');
		resetIdleTimer();
	});
}

function restartSession() {
	// Kill the timeline before animating exit
	if (timeoutTimeline) {
		timeoutTimeline.kill();
		timeoutTimeline = null;
	}
	
	animateTimeoutExit(() => {
		timeoutOverlay?.classList.remove('active');
		showView('welcome');
		resetIdleTimer();
	});
}

function animateTimeoutExit(callback) {
	// Animate exit
	gsap.timeline()
		.to([timeoutCard, timerCircle], { 
			scale: 0.8, 
			opacity: 0, 
			duration: 0.3, 
			ease: "power2.in" 
		})
		.call(callback, null, "-=0.1");
}

// Modal Functions
function buildModal(modalObj) {
	
	const modal = modalObj;
	const modalName = modal.attributes['id'].value;
	const modalClose = modal.querySelector('.modal-close');
	const modalTrigger = document.querySelectorAll('[data-modal-trigger="' + modalName + '"]');
	const modalTL = gsap.timeline({paused: true});
	
	modalTL.set(modal, { opacity: 0, visibility: 'hidden', zIndex: -1000 })
			 	 .set(modal, { visibility: 'visible', zIndex: 1000 })
			 	 .to(modal, { opacity: 1, duration: 0.25 });
				 
	window[modalName] = modalTL;
	
	modalTrigger.forEach(trigger => {
		trigger.addEventListener('click', function() {
			modalTL.play();
			// Mark that modal just opened to prevent auto-play
			modalJustOpened = true;
			setTimeout(() => {
				modalJustOpened = false;
			}, 1000); // Reset after 1 second
			
			// Track modal opening
			trackEvent('modal_opened', { 
				modal_name: modalName,
				trigger_element: this.textContent || this.dataset.modalTrigger
			});
		});
	});
	
	if (modalClose) {
		modalClose.addEventListener('click', function() {
			modalTL.reverse();
			// Track modal closing
			trackEvent('modal_closed', { modal_name: modalName });
		});
	}
	
}

function createSwiperConfig(parentId) {
	const parent = parentId;
	
	return {
		name: parent.attributes['data-swiper-name'].value,
		parent: parent,
		slider: parent.querySelector('.swiper'),
		pagination: parent.querySelector('.modal-nav .swiper-pagination'),
		buttons: {
			prev: parent.querySelector('.modal-nav .swiper-button-prev'),
			next: parent.querySelector('.modal-nav .swiper-button-next'),
			close: parent.querySelector('.modal-close'),
			goto: document.querySelectorAll('[data-modal-trigger="' + parent.attributes['id'].value + '"][data-goto-slide]'),
		}
	};
}

// Media Playing Property
Object.defineProperty(HTMLMediaElement.prototype, 'playing', {
	get: function(){
		return !!(this.currentTime > 0 && !this.paused && !this.ended && this.readyState > 2);
	}
})

// Helper function to show play button overlay for videos that fail autoplay
function showVideoPlayButton(video) {
	const container = video.parentNode;
	let playOverlay = container.querySelector('.video-play-overlay');
	
	if (!playOverlay) {
		playOverlay = document.createElement('div');
		playOverlay.className = 'video-play-overlay';
		playOverlay.innerHTML = `
			<button class="video-play-btn" style="
				position: absolute;
				top: 50%;
				left: 50%;
				transform: translate(-50%, -50%);
				background: rgba(0,0,0,0.7);
				border: none;
				border-radius: 50%;
				width: 80px;
				height: 80px;
				color: white;
				font-size: 24px;
				cursor: pointer;
				z-index: 10;
				display: flex;
				align-items: center;
				justify-content: center;
			">
				▶
			</button>
		`;
		container.style.position = 'relative';
		container.appendChild(playOverlay);
		
		// Add click handler to play button
		playOverlay.querySelector('.video-play-btn').addEventListener('click', function() {
			userInteracted = true;
			video.play().catch(error => {
				console.log('Manual video play failed:', error);
			});
		});
	}
	
	playOverlay.style.display = 'block';
}

// Demo Swipers
function buildSwiper(swiperObj) {
	const vwValue = 2.222222;
	const viewportWidth = window.innerWidth;
	const pxValue = (viewportWidth * vwValue) / 100;
	const modalClose = swiperObj.buttons.close;
	let config = {};
	
	if (swiperObj.name === 'brochureSwiper' || swiperObj.name === 'hfsSwiper') {
		config = {
			slidesPerView: 1.115,
			spaceBetween: pxValue,
			centeredSlides: false,
			pagination: {
				el: swiperObj.pagination,
				type: "bullets",
			},
			navigation: {
				nextEl: swiperObj.buttons.next,
				prevEl: swiperObj.buttons.prev,
			},
		};
	} else {
		config = {
			slidesPerView: 1,
			spaceBetween: 24,
			effect: "fade",
			fadeEffect: {
				crossFade: true,
			},
			pagination: {
				el: swiperObj.pagination,
				type: "custom",
				renderCustom: function (swiper, current, total) {
					return current + ' of ' + total;
				},
			},
			navigation: {
				nextEl: swiperObj.buttons.next,
				prevEl: swiperObj.buttons.prev,
			},
		};
	}
	const swiper = new Swiper(swiperObj.slider, {
		...config,
	});
	
	const videos = swiperObj.parent.querySelectorAll('video') || [];
	
	if (swiperObj.buttons.goto) {
		swiperObj.buttons.goto.forEach(btn => {
			btn.addEventListener('click', function() {
				const targetSlide = parseInt(btn.dataset.gotoSlide);
				swiper.slideTo(targetSlide, 0);
				
				// Track direct slide navigation
				trackEvent('swiper_slide_goto', {
					swiper_name: swiperObj.name,
					target_slide: targetSlide,
					total_slides: swiper.slides.length
				});
				
				if (videos.length > 0 && !videos[btn.dataset.gotoSlide].playing) {
					// Mark user interaction for Android autoplay policy
					userInteracted = true;
					videos[btn.dataset.gotoSlide].play().catch(error => {
						console.log('Video play failed:', error);
					});
					// Pause idle timer while video is playing
					stopIdleTimer();
					// Track demo video start
					trackEvent('demo_video_started', { 
						swiper_name: swiperObj.name,
						slide_index: btn.dataset.gotoSlide,
						video_src: videos[btn.dataset.gotoSlide].src
					});
				}
			});
		});
	}
	
	if (videos.length > 0) {
		
		videos.forEach((video, index) => {
			video.addEventListener('ended', function() {
				// Resume idle timer when video ends
				resetIdleTimer();
				swiper.slideNext();
				// Track demo video completion
				trackEvent('demo_video_completed', { 
					swiper_name: swiperObj.name,
					slide_index: index,
					video_src: video.src
				});
			});
			
			// Add event listeners for play/pause to manage idle timer
			video.addEventListener('play', function() {
				// Stop any other currently playing video
				if (currentPlayingVideo && currentPlayingVideo !== this && currentPlayingVideo.playing) {
					currentPlayingVideo.pause();
					currentPlayingVideo.currentTime = 0;
				}
				
				// Set this as the current playing video
				currentPlayingVideo = this;
				
				// Pause idle timer when video starts playing
				stopIdleTimer();
				// Hide any play button overlay
				const playOverlay = this.parentNode.querySelector('.video-play-overlay');
				if (playOverlay) {
					playOverlay.style.display = 'none';
				}
			});
			
			video.addEventListener('pause', function() {
				// Clear current playing video if this was it
				if (currentPlayingVideo === this) {
					currentPlayingVideo = null;
				}
				
				// Only resume idle timer if this video was actually playing
				// and we're not in the middle of a slide change
				if (this.playing || this.currentTime > 0) {
					// Small delay to avoid conflicts with slide change logic
					setTimeout(() => {
						resetIdleTimer();
					}, 100);
				}
			});
			
			// Remove automatic canplay handling to prevent all videos from playing at once
			// Videos will only play when explicitly triggered by user actions
		});

		swiper.on('slideChange', function(swiper) {
			// Track slide change
			trackEvent('swiper_slide_changed', {
				swiper_name: swiperObj.name,
				from_slide: swiper.previousIndex,
				to_slide: swiper.activeIndex,
				total_slides: swiper.slides.length
			});

			const previousVideo = videos[swiper.previousIndex];
			const nextVideo = videos[swiper.activeIndex];

			// Always pause previous video first
			if (previousVideo) {
				previousVideo.pause();
				previousVideo.currentTime = 0;
				// Clear current playing video if it was the previous one
				if (currentPlayingVideo === previousVideo) {
					currentPlayingVideo = null;
				}
			}

			// Handle next video - only auto-play if modal wasn't just opened
			if (nextVideo && !nextVideo.playing && userInteracted && !modalJustOpened) {
				// Only auto-play if user has interacted (Android autoplay policy)
				nextVideo.play().catch(error => {
					console.log('Video autoplay failed:', error);
					// If autoplay fails, show play button or handle gracefully
				});
				// Pause idle timer when next video starts playing
				stopIdleTimer();
			} else if (nextVideo && !nextVideo.playing) {
				// If next video can't autoplay, resume idle timer
				resetIdleTimer();
			}

		});
		
		if (modalClose) {
			modalClose.addEventListener('click', function() {
				videos.forEach(video => {
					video.pause();
					video.currentTime = 0;
				});
				// Clear current playing video
				currentPlayingVideo = null;
				// Resume idle timer when modal is closed and videos are stopped
				resetIdleTimer();
			});
		}
		
	}
	
	if (modalClose && videos.length === 0) {
		modalClose.addEventListener('click', function() {
			setTimeout(() => {
				swiper.slideTo(0, 0);
			}, 1000);
		});
	}
	
	window[swiperObj.name] = swiper;
	
	return swiper;
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
		
	// Dashboard card states
	const dashboardCards = document.querySelectorAll('.dashboard-card');
	dashboardCards.forEach(card => {
		card.addEventListener('click', function() {
			card.classList.toggle('visited');
			// Track dashboard card interaction
			trackEvent('dashboard_card_clicked', { 
				card_title: this.querySelector('h3')?.textContent || 'Unknown',
				card_type: this.dataset.cardType || 'general'
			});
		});
	});
	
	// Trivia cards
	const triviaCards = document.querySelectorAll('.trivia-card .card__wrap');
	triviaCards.forEach(card => {
		card.addEventListener('click', function() {
			card.classList.toggle('is-flipped');
			// Track trivia card interaction
			trackEvent('trivia_card_flipped', { 
				card_text: this.querySelector('.card__text')?.textContent || 'Unknown'
			});
		});
	});
	
	// Main site navigation
	const viewButtons = document.querySelectorAll('[data-view]');
	viewButtons.forEach(btn => {
		btn.addEventListener('click', function() {
			const viewId = this.dataset.view;
			showView(viewId);
			triviaCards.forEach(card => {
				card.classList.remove('is-flipped');
			});
		});
	});
	
	// Quiz answer selection
	document.addEventListener('click', function(e) {
		if (e.target.classList.contains('answer')) {
			selectAnswer(e.target);
		}
	});
	
	// Quiz navigation buttons
	document.addEventListener('click', function(e) {
		if (e.target.classList.contains('quiz-next') || e.target.closest('.quiz-next')) {
			e.preventDefault();
			nextQuestion();
		} else if (e.target.classList.contains('quiz-previous') || e.target.closest('.quiz-previous')) {
			e.preventDefault();
			previousQuestion();
		}
	});
	
	// Initialize modal elements
	initModalElements();
	
	// Modals Logic
	buildModal(walkthroughModal);
	buildModal(formModal);
	buildModal(demosBusinessModal);
	buildModal(demosTechModal);
	buildModal(brochureModal);
	buildModal(hfsModal);
	
	// Platform Walkthrough Swiper
	const walkthroughSwiperObj = createSwiperConfig(walkthroughModal);
	buildSwiper(walkthroughSwiperObj);
	
	// Demo Swipers - Helper function to create swiper config	
	const demoBusinessSwiperObj = createSwiperConfig(demosBusinessModal);
	const demoTechSwiperObj = createSwiperConfig(demosTechModal);
	buildSwiper(demoBusinessSwiperObj);
	buildSwiper(demoTechSwiperObj);
	
	// Case Studies Swipers
	const caseStudySwipers = document.querySelectorAll('.case-studies-view');
	caseStudySwipers.forEach(csItem => {
		
		const swiper = new Swiper(csItem.querySelector('.swiper'), {
			effect: "coverflow",
			centeredSlides: true,
			slidesPerView: 3,
			coverflowEffect: {
				rotate: 0,
				stretch: "70%",
				scale: 0.9,
				depth: 100,
				modifier: 1,
				slideShadows: false,
			},
			pagination: {
				el: csItem.querySelector('.swiper-pagination'),
			},
			navigation: {
				nextEl: csItem.querySelector('.swiper-button-next'),
				prevEl: csItem.querySelector('.swiper-button-prev'),
			},
		});
		
		// Add slide change tracking for case studies
		swiper.on('slideChange', function(swiper) {
			const activeSlide = swiper.slides[swiper.activeIndex];
			const caseStudyTitle = activeSlide?.querySelector('.cs-card .card-header h3')?.textContent || 'Unknown';
			const caseStudyType = csItem.id === 'caseStudiesBusiness' ? 'Business' : 'Technical';
			
			trackEvent('case_study_slide_changed', {
				swiper_name: 'caseStudiesSwiper',
				from_slide: swiper.previousIndex,
				to_slide: swiper.activeIndex,
				total_slides: swiper.slides.length,
				case_study_title: caseStudyTitle,
				case_study_type: caseStudyType
			});
		});
		
	});
	
	// Brochure Swiper
	const brochureSwiperObj = createSwiperConfig(brochureModal);
	buildSwiper(brochureSwiperObj);
	
	// HFS Swiper
	const hfsSwiperObj = createSwiperConfig(hfsModal);
	buildSwiper(hfsSwiperObj);
	
	// Country Select
	const countrySelect = document.querySelector('#countrySelect');
	const slimSelect = new SlimSelect({
		select: countrySelect,
		events: {
			afterChange: (newVal) => {
				clearSlimSelectError();
			}
		}
	});
	
	// Make SlimSelect instance globally accessible for debugging
	window.slimSelect = slimSelect;
	
	// SlimSelect Error Handling Functions
	function clearSlimSelectError() {
		const slimSelectContainer = document.querySelector('.ss-main');
		const parent = slimSelectContainer.parentNode;
		if (slimSelectContainer) {
			slimSelectContainer.classList.remove('error');
			const errorMsg = parent.querySelector('.error-message');
			parent.classList.remove('error');
			if (errorMsg) {
				errorMsg.remove();
			}
		}
	}
	
	function showSlimSelectError(message) {
		const slimSelectContainer = document.querySelector('.ss-main');
		if (slimSelectContainer) {
			slimSelectContainer.classList.add('error');
			
			// Remove existing error message if any
			const existingError = slimSelectContainer.parentNode.querySelector('.error-message');
			if (existingError) {
				existingError.remove();
			}
			
			// Create new error message
			const errorMsg = document.createElement('div');
			const parent = slimSelectContainer.parentNode;
			errorMsg.className = 'error-message';
			errorMsg.textContent = message;
			parent.classList.add('error');
			parent.insertBefore(errorMsg, slimSelectContainer.nextSibling);
		}
	}
	
	// Form Validation Functions
	function validateForm(form) {
		const errors = [];
		const formData = new FormData(form);
		const data = Object.fromEntries(formData.entries());
		
		// Clear previous error states
		clearFormErrors(form);
		
		// Validate First Name
		if (!data['First Name'] || data['First Name'].trim().length < 2) {
			errors.push({
				field: 'First Name',
				message: 'First name must be at least 2 characters long'
			});
		}
		
		// Validate Last Name
		if (!data['Last Name'] || data['Last Name'].trim().length < 2) {
			errors.push({
				field: 'Last Name',
				message: 'Last name must be at least 2 characters long'
			});
		}
		
		// Validate Company
		if (!data['Company'] || data['Company'].trim().length < 2) {
			errors.push({
				field: 'Company',
				message: 'Company name must be at least 2 characters long'
			});
		}
		
		// Validate Email
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!data['Work Email'] || !emailRegex.test(data['Work Email'])) {
			errors.push({
				field: 'Work Email',
				message: 'Please enter a valid email address'
			});
		}
		
		// Validate Country
		if (!data['Country'] || data['Country'] === '') {
			errors.push({
				field: 'Country',
				message: 'Please select a country'
			});
		}
		
		// Display errors if any
		if (errors.length > 0) {
			displayFormErrors(form, errors);
			return false;
		}
		
		return true;
	}
	
	function clearFormErrors(form) {
		// Remove error classes and messages
		const inputs = form.querySelectorAll('input, select');
		inputs.forEach(input => {
			input.classList.remove('error');
			const errorMsg = input.parentNode.querySelector('.error-message');
			if (errorMsg) {
				errorMsg.remove();
			}
		});
		
		// Clear SlimSelect errors
		clearSlimSelectError();
	}
	
	function createErrorMessage(input, message) {
		const errorMsg = document.createElement('div');
		errorMsg.className = 'error-message';
		errorMsg.textContent = message;
		input.parentNode.insertBefore(errorMsg, input.nextSibling);
	}
	
	function displayFormErrors(form, errors) {
		errors.forEach(error => {
			const fieldName = error.field;
			const input = form.querySelector(`[name="${fieldName}"]`);
			
			if (input) {
				// Special handling for Country field (SlimSelect)
				if (fieldName === 'Country') {
					showSlimSelectError(error.message);
				} else {
					// Add error class
					input.classList.add('error');
					
					// Create error message
					createErrorMessage(input, error.message);
				}
				
				// Focus on first error field
				//if (errors.indexOf(error) === 0) {
				//	input.focus();
				//}
			}
		});
		
		// Track validation errors
		trackEvent('form_validation_error', { 
			errors: errors.map(e => e.field),
			error_count: errors.length
		});
	}

	// Form Handling
	if (contactForm) {
		contactForm.addEventListener('submit', function(e) {
			e.preventDefault();
			
			// Validate form before submission
			if (!validateForm(this)) {
				return; // Stop submission if validation fails
			}
			
			const formData = new FormData(this);
			const data = Object.fromEntries(formData.entries());
			data.timestamp = new Date().toISOString();
			
			// Save to localStorage
			let submissions = JSON.parse(localStorage.getItem('kioskSubmissions') || '[]');
			submissions.push(data);
			localStorage.setItem('kioskSubmissions', JSON.stringify(submissions));

			// Track successful form submission
			trackEvent('form_submitted', { 
				form_type: 'contact',
				country: data['Country']
			});

			// Show thanks message
			gsap.to(formContainer, {
				opacity: 0,
				visibility: 'hidden',
				duration: 0.5,
				onComplete: function() {
					gsap.to(formThanks, {
						opacity: 1,
						duration: 0.5,
					});
				}
			});
			this.reset();
		});
		
		// Real-time validation on input change
		const inputs = contactForm.querySelectorAll('input, select');
		inputs.forEach(input => {
			input.addEventListener('blur', function() {
				// Clear previous error for this field
				this.classList.remove('error');
				const errorMsg = this.parentNode.querySelector('.error-message');
				if (errorMsg) {
					errorMsg.remove();
				}
				
				// Validate individual field
				const fieldName = this.name;
				const value = this.value.trim();
				
				if (fieldName === 'First Name' || fieldName === 'Last Name' || fieldName === 'Company') {
					if (value.length > 0 && value.length < 2) {
						showFieldError(this, `${fieldName} must be at least 2 characters long`);
					}
				} else if (fieldName === 'Work Email') {
					const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
					if (value.length > 0 && !emailRegex.test(value)) {
						showFieldError(this, 'Please enter a valid email address');
					}
				} else if (fieldName === 'Country') {
					if (value === '') {
						showSlimSelectError('Please select a country');
					}
				}
			});
		});
		
		function showFieldError(input, message) {
			input.classList.add('error');
			createErrorMessage(input, message);
		}
	}
	
	// Restart buttons
	const restartButtons = document.querySelectorAll('[data-restart]');
	restartButtons.forEach(btn => {
		btn.addEventListener('click', function() {
			endCurrentSession();
			window.location.reload();
		});
	});
	
	// Touch/click events to reset idle timer and mark user interaction
	['touchstart', 'touchend', 'click', 'keydown'].forEach(event => {
		document.addEventListener(event, function() {
			userInteracted = true; // Mark user interaction for Android autoplay
			resetIdleTimer();
		}, { passive: true });
	});

	// Fix for persistent :active states on touch devices
	//['touchend', 'touchcancel'].forEach(event => {
	//	document.addEventListener(event, function() {
	//		// Small delay to ensure the touch event has completed
	//		setTimeout(clearActiveStates, 50);
	//	}, { passive: true });
	//});

	// Admin Panel
	const adminBtn = document.querySelector('.admin-btn');
	let adminClickCount = 0;
	adminBtn.addEventListener('click', function() {
		adminClickCount++;
		if (adminClickCount >= 10) {
			window.location.href = 'admin.html';
		}
	});
	
	// Tell Android when a native <select> opens/closes
	function _notifyPicker(open) {
		try { AndroidKiosk?.setPickerOpen?.(open) } catch(e) {}
	}
	document.addEventListener('focusin',  e => { if (e.target.tagName === 'SELECT') _notifyPicker(true)  }, true);
	document.addEventListener('change',   e => { if (e.target.tagName === 'SELECT') _notifyPicker(false) }, true);
	document.addEventListener('focusout', e => { if (e.target.tagName === 'SELECT') _notifyPicker(false) }, true);

	// Start idle timer
	resetIdleTimer();
	
});

// Session Management Functions
function generateSessionId() {
	const now = new Date();
	let hour = now.getHours();
	const minute = now.getMinutes().toString().padStart(2, '0');
	const ampm = hour >= 12 ? 'PM' : 'AM';
	
	// Convert to 12-hour format
	hour = hour % 12;
	hour = hour ? hour : 12; // 0 should be 12
	
	return `User at ${hour}:${minute} ${ampm}`;
}

function startNewSession() {
	currentSession = generateSessionId();
	sessionStartTime = new Date();
	
	// Track session start
	trackEvent('session_started', {
		session_id: currentSession,
		start_time: sessionStartTime.toISOString()
	});
}

function endCurrentSession() {
	if (currentSession && sessionStartTime) {
		const sessionDuration = Math.floor((new Date() - sessionStartTime) / 1000);
		trackEvent('session_ended', {
			session_id: currentSession,
			duration_seconds: sessionDuration,
			end_time: new Date().toISOString()
		});
	}
}

function formatTimestamp(timestamp) {
	const date = new Date(timestamp);
	return date.toLocaleString('en-US', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
		hour12: true
	});
}

function formatDuration(seconds) {
	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const secs = seconds % 60;
	
	if (hours > 0) {
		return `${hours}h ${minutes}m ${secs}s`;
	} else if (minutes > 0) {
		return `${minutes}m ${secs}s`;
	} else {
		return `${secs}s`;
	}
}

// Enhanced Analytics (session-based localStorage)
function trackEvent(eventType, data = {}) {
	// Start session if not already started
	if (!currentSession) {
		startNewSession();
	}
	
	const event = {
		type: eventType,
		timestamp: new Date().toISOString(),
		session_id: currentSession,
		view: currentView,
		...data
	};

	let events = JSON.parse(localStorage.getItem('kioskAnalytics') || '[]');
	events.push(event);
	localStorage.setItem('kioskAnalytics', JSON.stringify(events));
}

// Track view changes
const originalShowView = showView;
showView = function(viewId) {
	trackEvent('view_change', { from: currentView, to: viewId });
	originalShowView(viewId);
};