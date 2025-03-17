

// الحصول على جميع العناصر التي تحتوي على كلاس "tap"
const taps = document.querySelectorAll('.tap');

// إضافة حدث النقر لكل عنصر
taps.forEach(tap => {
    tap.addEventListener('click', function() {
        // إزالة كلاس "active" من جميع العناصر
        taps.forEach(t => t.classList.remove('active'));

        // إضافة كلاس "active" إلى العنصر الذي تم النقر عليه
        this.classList.add('active');
    });
});


// الحصول على جميع العناصر التي تحمل الكلاس section-head
const sectionHeads = document.querySelectorAll('.section-head');

// إضافة حدث النقر لكل عنصر
sectionHeads.forEach(sectionHead => {
  sectionHead.addEventListener('click', function() {
    // الحصول على أول عنصر div أسفل section-head
    const firstDivBelow = this.nextElementSibling;

    // تبديل كلاس active على الـ div
    if (firstDivBelow && firstDivBelow.tagName === 'DIV') {
      firstDivBelow.classList.toggle('active');
      // تبديل كلاس expanded على الـ section-head لتدوير السهم
      this.classList.toggle('expanded');
    }
  });
});
    
    
    
    

function addEventListenersToPersons() {
  const personElements = document.querySelectorAll('.person');
  
  personElements.forEach(person => {
    if (!person.dataset.listenerAdded) {
      person.addEventListener('click', function() {
        personElements.forEach(p => p.classList.remove('active'));
        this.classList.add('active');
      });

      person.addEventListener('touchstart', function() {
        // بدون e.preventDefault() للسماح بالتمرير
        personElements.forEach(p => p.classList.remove('active'));
        this.classList.add('active');
      });

      person.dataset.listenerAdded = 'true';
    }
  });
}

const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.addedNodes.length > 0) {
      addEventListenersToPersons();
    }
  });
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

addEventListenersToPersons();

