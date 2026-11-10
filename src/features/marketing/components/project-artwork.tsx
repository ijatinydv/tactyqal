import { useId } from "react";
import type { ProjectStory } from "@/content/projects";

// give each illustrative project a distinct original visual without implying a finished product
export function ProjectArtwork({ project, className = "" }: { project: ProjectStory; className?: string }) {
  const titleId = `artwork-title-${useId()}`;

  return (
    <figure className={`overflow-hidden bg-[#e9eee8] ${className}`}>
      <svg viewBox="0 0 720 500" role="img" aria-labelledby={titleId} className="block h-auto w-full">
        <title id={titleId}>{project.visual === "library" ? "Illustrated book-sharing shelf concept" : "Illustrated neighbourhood market guide concept"}</title>
        {project.visual === "library" ? (
          <>
            <rect width="720" height="500" fill="#e9eee8" />
            <circle cx="596" cy="96" r="54" fill="#d6e1d6" />
            <path d="M0 374C135 335 231 420 366 385s229-50 354-7v122H0z" fill="#dce5d8" />
            <rect x="75" y="82" width="360" height="312" rx="3" fill="#fffdf8" />
            <path d="M75 151h360" stroke="#d7ddd4" strokeWidth="2" />
            <text x="106" y="124" fill="#245544" fontSize="18" fontFamily="Georgia,serif">A shelf around the corner</text>
            <rect x="105" y="180" width="118" height="152" fill="#f4eee2" />
            <path d="M119 203h79M119 214h70" stroke="#a1aa98" strokeWidth="3" />
            <rect x="123" y="239" width="24" height="72" fill="#b9684e" />
            <rect x="152" y="226" width="20" height="85" fill="#758c68" />
            <rect x="177" y="244" width="28" height="67" fill="#d5ad63" />
            <text x="248" y="205" fill="#596257" fontSize="12" fontFamily="Arial,sans-serif" letterSpacing="2">NEARBY SHELF</text>
            <text x="248" y="240" fill="#202620" fontSize="22" fontFamily="Georgia,serif">Stories to pass along</text>
            <path d="M248 263h145" stroke="#d7ddd4" strokeWidth="2" />
            <text x="248" y="291" fill="#596257" fontSize="14" fontFamily="Arial,sans-serif">Browse a few sample titles</text>
            <rect x="248" y="309" width="122" height="34" rx="17" fill="#245544" />
            <text x="270" y="331" fill="#fffdf8" fontSize="12" fontFamily="Arial,sans-serif">See the shelf</text>
            <path d="M473 360c15-61 41-91 81-91s70 30 84 91" fill="#a9b995" />
            <circle cx="554" cy="241" r="33" fill="#d6a77d" />
            <path d="M522 241c2-29 15-45 38-45 19 0 34 17 33 42-20-1-38-9-51-23-2 11-8 19-20 26" fill="#454c40" />
            <path d="M538 361v-44h65v44" fill="#f5f0e6" />
            <path d="M540 329h61" stroke="#b9684e" strokeWidth="6" />
            <text x="75" y="438" fill="#596257" fontSize="12" fontFamily="Arial,sans-serif" letterSpacing="2">CONCEPT SKETCH · NOT A BUILT PRODUCT</text>
          </>
        ) : (
          <>
            <rect width="720" height="500" fill="#e9eee8" />
            <path d="M0 405c126-41 243 30 355-3 120-35 246-68 365-21v119H0z" fill="#dce5d8" />
            <rect x="72" y="75" width="432" height="328" rx="3" fill="#fffdf8" />
            <rect x="72" y="75" width="432" height="65" fill="#245544" />
            <text x="105" y="116" fill="#fffdf8" fontSize="22" fontFamily="Georgia,serif">A slower kind of Saturday</text>
            <text x="105" y="178" fill="#596257" fontSize="12" fontFamily="Arial,sans-serif" letterSpacing="2">MARKET GUIDE · SAMPLE LAYOUT</text>
            <path d="M105 200h360" stroke="#d7ddd4" strokeWidth="2" />
            <path d="M132 235l92 39-92 47-92-47z" fill="#d8e2d1" transform="translate(46 0)" />
            <path d="M178 274v71M132 274l46 22 46-22M132 274v71l46 23 46-23v-71" fill="none" stroke="#758c68" strokeWidth="2" />
            <circle cx="178" cy="274" r="7" fill="#b9684e" />
            <circle cx="132" cy="345" r="5" fill="#d5ad63" />
            <circle cx="224" cy="345" r="5" fill="#d5ad63" />
            <text x="285" y="239" fill="#202620" fontSize="22" fontFamily="Georgia,serif">Find your way</text>
            <text x="285" y="267" fill="#596257" fontSize="14" fontFamily="Arial,sans-serif">A sample map and stall guide</text>
            <path d="M285 293h150" stroke="#d7ddd4" strokeWidth="2" />
            <circle cx="294" cy="321" r="5" fill="#b9684e" />
            <text x="309" y="326" fill="#596257" fontSize="13" fontFamily="Arial,sans-serif">Fresh produce</text>
            <circle cx="294" cy="350" r="5" fill="#d5ad63" />
            <text x="309" y="355" fill="#596257" fontSize="13" fontFamily="Arial,sans-serif">Bakes and preserves</text>
            <path d="M537 351v-97l73-37 73 37v97z" fill="#d6a77d" />
            <path d="M524 256l86-51 86 51" fill="none" stroke="#b9684e" strokeWidth="9" />
            <path d="M552 280h31v71h-31zM594 280h31v71h-31zM636 280h31v71h-31z" fill="#f5f0e6" />
            <path d="M552 299h31M594 299h31M636 299h31" stroke="#758c68" strokeWidth="7" />
            <text x="72" y="442" fill="#596257" fontSize="12" fontFamily="Arial,sans-serif" letterSpacing="2">CONCEPT SKETCH · DETAILS NEED LOCAL CONFIRMATION</text>
          </>
        )}
      </svg>
    </figure>
  );
}
