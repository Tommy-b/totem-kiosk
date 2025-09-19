// App State
let currentView = 'welcome';
let idleTimer = null;
let timeoutTimer = null;
let timeLeft = 30;

// Demo Data
const demoData = [
	{
		id: 0,
		image: 'assets/images/onboarding-app-demo-thumb.webp',
		video: 'assets/video/onboarding-app-demo.webm',
		title: 'Developing a mobile onboarding app',
		description: 'Discover how Slingshot can be used to develop a secure, intuitive mobile onboarding app for a commercial bank'
	},
	{
		id: 1,
		image: 'assets/images/payment-platform-demo-thumb.webp',
		video: 'assets/video/payment-platform-demo.webm',
		title: 'Building a secure payment platform',
		description: 'Explore how Slingshot advances development of a cloud-native payment platform that meets international banking standards'
	},
	{
		id: 2,
		image: 'assets/images/cobol-demo-thumb.webp',
		video: 'assets/video/cobol-demo.webm',
		title: 'Modernizing COBOL to Java for cloud',
		description: 'Learn how Slingshot helps organizations migrate legacy systems and modernize outdated code faster and with less risk'
	},
	{
		id: 3,
		image: 'assets/images/figma-demo-thumb.webp',
		video: 'assets/video/figma-demo.webm',
		title: 'Creating a user profile page using Figma to code agents',
		description: 'Watch how Slingshot converts Figma designs into production-ready code in seconds—streamlining the path from design to development'
	},
	{
		id: 4,
		image: 'assets/images/insurance-app-demo-thumb.webp',
		video: 'assets/video/insurance-app-demo.webm',
		title: 'Modernizing a legacy insurance application',
		description: 'Discover how Slingshot can use AI agents to help modernize outdated legacy code and effectively upgrade your customer experience'
	},	
	{
		id: 5,
		image: 'assets/images/banking-app-demo-thumb.webp',
		video: 'assets/video/banking-app-demo-business.webm',
		title: 'Developing an agentic consumer banking app',
		description: 'Explore how Slingshot delivers a modern consumer banking app powered by agentic AI—covering the full SDLC from design to deployment'
	},
	{
		id: 6,
		image: 'assets/images/banking-app-demo-thumb.webp',
		video: 'assets/video/banking-app-demo-tech.webm',
		title: 'Developing an agentic consumer banking app',
		description: 'See how Slingshot delivers a modern consumer banking app powered by agentic AI—covering the full SDLC from design to deployment'
	}
];

// Quiz Data
const businessQuiz = {
	title: 'Business Quiz',
	questions: [
		{
			text: 'What percentage of leaders cite faster innovation and time-to-market as a reason to shift to AI-driven service models?',
			options: ['22%', '36%', '46%', '49%'],
			correct: 2
		},
		{
			text: 'Customer and employee impact matters too. What percentage of leaders point to better experiences as a primary reason for adopting AI-driven service models?',
			options: ['22%', '36%', '41%', '44%'],
			correct: 2
		},
		{
			text: 'Nearly half of leaders told HFS that outdated systems block innovation. What percentage specifically point to technical debt as the reason they can\'t launch new digital services fast enough?',
			options: ['26%', '36%', '46%', '49%'],
			correct: 3
		}
	],
	results: {
		1: 'You\'ve spotted a few drivers of AI adoption, but there\'s more to uncover. Many leaders still wrestle with tech debt while chasing innovation and better experiences. Explore the resources below to see how enterprises are moving forward.',
		2: 'Well done — you\'re on your way. You understand how AI can drive innovation and better experiences, but tech debt is still a critical barrier. The HFS report and Slingshot brochure reveal how leaders are overcoming it.',
		3: 'Excellent work! You clearly understand what drives AI adoption — innovation, agility, and experiences — and how tech debt slows progress. To go further, explore the HFS report and Slingshot brochure for strategies and success stories.'
	}
};

const technicalQuiz = {
	title: 'Technical Quiz',
	questions: [
		{
			text: 'On average, organizations spend 1/3 of their IT budgets on modernization efforts. However, only ___ of organizations have fully modernized their core applications.',
			options: ['80%', '75%', '90%', '30%'],
			correct: 3
		},
		{
			text: 'Only 1 in 5 firms are scaling AI across multiple functions. Which is a key challenge that organizations face in adopting AI for IT?',
			options: ['Shortage of skilled talent to implement and manage AI', 'Difficulty integrating AI with legacy systems', 'Data quality and governance issues', 'All of the above'],
			correct: 3
		},
		{
			text: 'Nearly half of enterprise leaders say legacy constraints are blocking innovation. What percentage specifically cited tech debt as a driver for shifting to AI-led service models?',
			options: ['26%', '36%', '46%', '49%'],
			correct: 3
		}
	],
	results: {
		1: 'You\'ve uncovered some of the challenges around tech debt, but there\'s more to learn. Technical debt remains a major barrier for enterprises, and AI-led modernization is changing the game. Dive deeper with the resources below to strengthen your understanding.',
		2: 'Well done — you\'re on your way. You recognize the impact of tech debt and modernization, but there\'s still more to explore. The HFS report and Slingshot brochure offer practical insights into how enterprises are overcoming these obstacles.',
		3: 'Excellent work! You clearly understand the realities of tech debt and modernization. To go further, explore the HFS report and Slingshot brochure for data, strategies, and examples of how enterprises are already putting these ideas into action.'
	}
};

// View Management
function showView(viewId) {
	// Hide all views
	document.querySelectorAll('.view').forEach(view => {
		view.classList.remove('active');
	});

	// Show target view
	document.getElementById(viewId).classList.add('active');

	// Update navigation
	document.querySelectorAll('.nav-btn').forEach(btn => {
		btn.classList.remove('active');
	});
	document.querySelector(`[data-view="${viewId}"]`)?.classList.add('active');

	currentView = viewId;
	//resetIdleTimer();

	// Initialize quiz if needed
	if (viewId === 'business-quiz') {
		initQuiz('business-quiz', businessQuiz);
	} else if (viewId === 'technical-quiz') {
		initQuiz('technical-quiz', technicalQuiz);
	}
}

// Quiz Functions
function initQuiz(containerId, quizData) {
	const container = document.getElementById(containerId === 'business-quiz' ? 'quizContent' : 'quizContentTech');
	container.innerHTML = '';

	quizData.questions.forEach((question, qIndex) => {
		const questionDiv = document.createElement('div');
		questionDiv.className = 'quiz-question';
		questionDiv.innerHTML = `
			<div class="h4">${qIndex + 1}. ${question.text}</div>
			<div class="quiz-options">
				${question.options.map((option, oIndex) => `
					<div class="quiz-option" onclick="selectOption(this, ${qIndex}, ${oIndex}, ${question.correct})">
						${option}
					</div>
				`).join('')}
			</div>
		`;
		container.appendChild(questionDiv);
	});

	const submitBtn = document.createElement('button');
	submitBtn.className = 'btn';
	submitBtn.textContent = 'Check Answers';
	submitBtn.onclick = () => checkQuiz(quizData);
	container.appendChild(submitBtn);
}

let selectedAnswers = {};

function selectOption(element, questionIndex, optionIndex, correctIndex) {
	// Remove previous selection for this question
	const questionDiv = element.closest('.quiz-question');
	questionDiv.querySelectorAll('.quiz-option').forEach(opt => {
		opt.classList.remove('selected');
	});

	// Select this option
	element.classList.add('selected');
	selectedAnswers[questionIndex] = optionIndex;
}

function checkQuiz(quizData) {
	let score = 0;
	quizData.questions.forEach((question, index) => {
		if (selectedAnswers[index] === question.correct) {
			score++;
		}
	});

	const container = document.getElementById(currentView === 'business-quiz' ? 'quizContent' : 'quizContentTech');
	container.innerHTML = `
		<div class="h3">Quiz Results</div>
		<div class="p" style="margin: 20px 0;">You scored ${score} out of ${quizData.questions.length}!</div>
		<div class="p" style="margin: 20px 0;">${quizData.results[score]}</div>
		<div class="card-grid" style="margin-top: 30px;">
			<div class="card">
				<div class="h4">HFS Report</div>
				<p class="p-sm">Why AI is the jackhammer for breaking tech debt and modernizing legacy systems.</p>
			</div>
			<div class="card">
				<div class="h4">Slingshot Brochure</div>
				<p class="p-sm">How Slingshot applies AI to cut debt, modernize faster, and deliver outcomes.</p>
			</div>
		</div>
		<button class="btn" onclick="showView('welcome')" style="margin-top: 30px;">Back to Home</button>
	`;
}


// Idle Timer Management
function resetIdleTimer() {
	clearTimeout(idleTimer);
	clearTimeout(timeoutTimer);
	document.getElementById('timeoutOverlay').classList.remove('active');
	timeLeft = 30;

	idleTimer = setTimeout(() => {
		document.getElementById('timeoutOverlay').classList.add('active');
		startCountdown();
	}, 30000); // 30 seconds
}

function startCountdown() {
	timeLeft = 30;
	document.getElementById('timerCircle').textContent = timeLeft;

	timeoutTimer = setInterval(() => {
		timeLeft--;
		document.getElementById('timerCircle').textContent = timeLeft;

		if (timeLeft <= 0) {
			restartSession();
		}
	}, 1000);
}

function resumeSession() {
	document.getElementById('timeoutOverlay').classList.remove('active');
	resetIdleTimer();
}

function restartSession() {
	document.getElementById('timeoutOverlay').classList.remove('active');
	showView('welcome');
	resetIdleTimer();
}

Object.defineProperty(HTMLMediaElement.prototype, 'playing', {
	get: function(){
		return !!(this.currentTime > 0 && !this.paused && !this.ended && this.readyState > 2);
	}
})

function buildDemoSwiper(swiperObj) {
	
	const swiper = new Swiper(swiperObj.slider, {
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
	});

	const videos = swiperObj.parent.querySelectorAll('video');
	
	videos.forEach(video => {
		video.addEventListener('ended', function() {
			swiper.slideNext();
		});
	});
	
	swiper.on('slideChange', function(swiper) {

		const previousVideo = videos[swiper.previousIndex];
		const nextVideo = videos[swiper.activeIndex];
		
		if (previousVideo.playing) {
			previousVideo.pause();
			previousVideo.currentTime = 0;
		}
		
		if (!nextVideo.playing) {
			setTimeout(() => {
				nextVideo.play();
			}, 400);
		}

	});
	
	window[swiperObj.name] = swiper;
	
	return swiper;
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
	
	// Navigation buttons
	const navButtons = document.querySelectorAll('.nav-btn');
	navButtons.forEach(btn => {
		btn.addEventListener('click', function() {
			const viewId = this.dataset.view;
			if (viewId) {
				showView(viewId);
			}
		});
	});
	
	// Main site navigation
	const viewButtons = document.querySelectorAll('[data-view]');
	viewButtons.forEach(btn => {
		btn.addEventListener('click', function() {
			const viewId = this.dataset.view;
			showView(viewId);
		});
	});
	
	// Trivia cards
	const triviaCards = document.querySelectorAll('.trivia-card .card__wrap');
	triviaCards.forEach(card => {
		card.addEventListener('click', function() {
			card.classList.toggle('is-flipped');
		});
	});
	
	// Demo Swipers - Helper function to create swiper config
	function createSwiperConfig(parentId) {
		const parent = document.getElementById(parentId);
		let name = '';
		if (parentId === 'demosBusinessOverlay') {
			name = 'demoBusinessSwiper';
		} else if (parentId === 'demosTechOverlay') {
			name = 'demoTechSwiper';
		}
		return {
			name: name,
			parent: parent,
			slider: parent.querySelector('.swiper'),
			pagination: parent.querySelector('.modal-nav .swiper-pagination'),
			buttons: {
				prev: parent.querySelector('.modal-nav .swiper-button-prev'),
				next: parent.querySelector('.modal-nav .swiper-button-next'),
			}
		};
	}
	
	const demoBusinessSwiperObj = createSwiperConfig('demosBusinessOverlay');
	const demoTechSwiperObj = createSwiperConfig('demosTechOverlay');

	buildDemoSwiper(demoBusinessSwiperObj);
	buildDemoSwiper(demoTechSwiperObj);
	
	// Demo Modals
	const demoBusinessBtns = document.querySelectorAll('[data-demoBusiness-slide]');
	const demoTechBtns = document.querySelectorAll('[data-demotech-slide]');
	const demoBusinessModal = demoBusinessSwiperObj.parent;
	const demoTechModal = demoTechSwiperObj.parent;
	const techModalVideos = demoTechModal.querySelectorAll('video');
	const businessModalVideos = demoBusinessModal.querySelectorAll('video');
	const demoBusinessModalTL = gsap.timeline({paused: true});
	const demoTechModalTL = gsap.timeline({paused: true});
	
	if (demoBusinessModal) {
		demoBusinessBtns.forEach(btn => {
			btn.addEventListener('click', function() {
				let slide = btn.dataset.demobusinessSlide;
				demoBusinessSwiper.slideTo(slide, 0);
				demoBusinessModalTL.play();
				if (!businessModalVideos[slide].playing) {
					businessModalVideos[slide].play();
				}
			});
		});

		const modalClose = demoBusinessModal.querySelector('.modal-close');
		
		demoBusinessModalTL.set(demoBusinessModal, { opacity: 0, visibility: 'hidden', zIndex: -1000 })
						 					 .set(demoBusinessModal, { visibility: 'visible', zIndex: 1000 })
						 					 .to(demoBusinessModal, { opacity: 1, duration: 0.25 });

		modalClose.addEventListener('click', function() {
			businessModalVideos.forEach(video => {
				video.pause();
				video.currentTime = 0;
			});
			demoBusinessModalTL.reverse();
		});
		
	}
	
	if (demoTechModal) {
		demoTechBtns.forEach(btn => {
			btn.addEventListener('click', function() {
				let slide = btn.dataset.demotechSlide;
				console.log(slide);
				demoTechSwiper.slideTo(slide, 0);
				demoTechModalTL.play();
				if (!techModalVideos[slide].playing) {
					techModalVideos[slide].play();
				}
			});
		});

		const modalClose = demoTechModal.querySelector('.modal-close');
		
		demoTechModalTL.set(demoTechModal, { opacity: 0, visibility: 'hidden', zIndex: -1000 })
						 			 .set(demoTechModal, { visibility: 'visible', zIndex: 1000 })
						 			 .to(demoTechModal, { opacity: 1, duration: 0.25 });
		
		modalClose.addEventListener('click', function() {
			techModalVideos.forEach(video => {
				video.pause();
				video.currentTime = 0;
			});
			demoTechModalTL.reverse();
		});
		
	}

	// Form Handling
	document.getElementById('contactForm').addEventListener('submit', function(e) {
		e.preventDefault();

		const formData = new FormData(this);
		const data = Object.fromEntries(formData.entries());
		data.timestamp = new Date().toISOString();

		// Save to localStorage
		let submissions = JSON.parse(localStorage.getItem('kioskSubmissions') || '[]');
		submissions.push(data);
		localStorage.setItem('kioskSubmissions', JSON.stringify(submissions));

		// Show thanks message
		document.getElementById('formThanks').style.display = 'block';
		this.reset();

	});
	
	// Form Modal
	const formModal = document.getElementById('form');
	const formModalOpen = document.querySelectorAll('.form-btn');
	const formModalClose = document.querySelector('.form-close');
	const formModalTL = gsap.timeline({paused: true});

	formModalTL.set(formModal, { opacity: 0, visibility: 'hidden', zIndex: -1000 })
						 .set(formModal, { visibility: 'visible', zIndex: 1000 })
						 .to(formModal, { opacity: 1, duration: 0.25 });
						 
	formModalOpen.forEach(btn => {
		btn.addEventListener('click', function() {
			formModalTL.play();
		});
	});

	formModalClose.addEventListener('click', function() {
		formModalTL.reverse();
	});
	
	// Touch/click events to reset idle timer
	//['touchstart', 'touchend', 'click', 'keydown'].forEach(event => {
	//	document.addEventListener(event, resetIdleTimer, { passive: true });
	//});

	// Start idle timer
	//resetIdleTimer();
	
});

// Analytics (simple localStorage-based)
function trackEvent(eventType, data = {}) {
	const event = {
		type: eventType,
		timestamp: new Date().toISOString(),
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