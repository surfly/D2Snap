import { JSDOM } from "jsdom";


export const analyzeDOMTargets = (res, reference, _, rawDOM) => {
    const { document } = new JSDOM(rawDOM).window;

    for(let trajectory of reference.trajectories) {
        if(res.length < trajectory.length) continue;

        let matchesTrajectory = true;
        for(let referenceElement of trajectory) {
            let matchesElement = false;
            for(let resElement of res) {
                let targetElement;
                try {
                    targetElement = document.documentElement.querySelector(resElement.cssSelector);
                } catch { /* */ }
                if(!targetElement) continue;
                const validTargetElements = [
                    targetElement,
                    targetElement?.parentElement,
                    targetElement?.parentElement?.parentElement,
                    targetElement?.parentElement?.parentElement?.parentElement,
                    ...Array.from(targetElement?.parentElement?.children ?? [])
                        .filter(child => child !== targetElement),
                    ...(targetElement?.children ?? [])
                ]
                    .filter(element => !!element);
                if(
                    validTargetElements
                        .map(validTargetElement => validTargetElement.matches(referenceElement.css_selector))
                        .includes(true)
                ) {
                    matchesElement = true;

                    break;
                }
            }

            if(matchesElement) continue;

            matchesTrajectory = false;

            break;
        }

        if(matchesTrajectory) return true;
    }

    return false;
};