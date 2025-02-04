import { Component } from '@angular/core';

@Component({
  selector: 'app-loading',
  standalone: true,
  template: `
    <div class="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" class="w-24 h-24">
        <circle fill="#000000" stroke="#000000" stroke-width="2" r="15" cx="40" cy="65">
          <animate 
            attributeName="cy" 
            calcMode="spline" 
            dur="0.9" 
            values="65;135;65;" 
            keySplines=".5 0 .5 1;.5 0 .5 1" 
            repeatCount="indefinite" 
            begin="-.4">
          </animate>
        </circle>
        <circle fill="#000000" stroke="#000000" stroke-width="2" r="15" cx="100" cy="65">
          <animate 
            attributeName="cy" 
            calcMode="spline" 
            dur="0.9" 
            values="65;135;65;" 
            keySplines=".5 0 .5 1;.5 0 .5 1" 
            repeatCount="indefinite" 
            begin="-.2">
          </animate>
        </circle>
        <circle fill="#000000" stroke="#000000" stroke-width="2" r="15" cx="160" cy="65">
          <animate 
            attributeName="cy" 
            calcMode="spline" 
            dur="0.9" 
            values="65;135;65;" 
            keySplines=".5 0 .5 1;.5 0 .5 1" 
            repeatCount="indefinite" 
            begin="0">
          </animate>
        </circle>
      </svg>
    </div>
  `
})
export class LoadingComponent {}