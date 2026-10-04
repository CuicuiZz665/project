function toggleSocialDd(btn){
            var dd = btn.closest('.footer-social-dd');
            var open = dd.classList.contains('open');
            document.querySelectorAll('.footer-social-dd.open').forEach(function(d){ d.classList.remove('open'); d.querySelector('.footer-social-btn').setAttribute('aria-expanded','false'); });
            if(!open){ dd.classList.add('open'); btn.setAttribute('aria-expanded','true'); }
          }
          document.addEventListener('click', function(e){
            if(e.target.closest('.footer-social-dd')) return;
            document.querySelectorAll('.footer-social-dd.open').forEach(function(d){ d.classList.remove('open'); d.querySelector('.footer-social-btn').setAttribute('aria-expanded','false'); });
          });
          document.addEventListener('keydown', function(e){ if(e.key==='Escape') document.querySelectorAll('.footer-social-dd.open').forEach(function(d){ d.classList.remove('open'); d.querySelector('.footer-social-btn').setAttribute('aria-expanded','false'); }); });
