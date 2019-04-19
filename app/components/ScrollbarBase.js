// @flow
import React, {Component} from 'react';
import {remote} from 'electron';
import $ from 'jquery';
import styles from './Window.scss';
import {C} from "../utils";


type Props = {
    onScroll: (e: number) => void
};

function clamp(number, min, max) {
    return Math.max(min, Math.min(number, max));
}

export default class ScrollbarBase extends Component<Props> {
    constructor() {
        super();
        this.scrollbar = React.createRef();
        this.slider = React.createRef();

        this.onMouseUp = this.onMouseUp.bind(this);
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);

        document.addEventListener('mouseup', () => this.onMouseUp());
    }

    componentDidMount() {
        const slider = $(this.slider.current);
        const scrollbar = $(this.scrollbar.current);
        slider.hover(() => slider.addClass("hovering"), () => {
            if (!slider.hasClass("dragging"))
                slider.removeClass("hovering")
        });
        scrollbar.hover(() => scrollbar.addClass("hovering"), () => {
            if (!slider.hasClass("dragging"))
                scrollbar.removeClass("hovering")
        });
        this.updateSliderSize();
    }

    componentWillUpdate() {
    }

    componentDidUpdate() {
    }

    componentWillUnmount(): void {
    }

    scrollbar;

    slider;

    mouseDownPosition;

    sliderPositionOnMouseDown;

    mContentHeight: number = 2368;

    mViewportHeight: number = 609;

    setHeights({contentHeight, viewportHeight}) {
        if (contentHeight !== this.mContentHeight || viewportHeight !== this.mViewportHeight) {
            const slider = $(this.slider.current);
            const scrollbar = $(this.scrollbar.current);
            const sliderPosition = parseInt(slider.css("top"), 10);
            const sliderTopOriginal = sliderPosition / (scrollbar.outerHeight(true) - slider.outerHeight(true)) * (this.mContentHeight - this.mViewportHeight);

            this.mContentHeight = contentHeight;
            this.mViewportHeight = viewportHeight;
            this.updateSliderSize();

            const sliderTopNew = sliderTopOriginal * (scrollbar.outerHeight(true) - slider.outerHeight(true)) / (this.mContentHeight - this.mViewportHeight);
            slider.css({
                "top": clamp(sliderTopNew, 0, scrollbar.outerHeight(true) - slider.outerHeight(true))
            });
            this.fireScrollEvent();
        }
    }

    get contentHeight() {
        return this.mContentHeight;
    }

    set contentHeight(value) {
        this.setHeights({contentHeight: value, viewportHeight: this.mViewportHeight});
    }

    get viewportHeight() {
        return this.mViewportHeight;
    }

    set viewportHeight(value) {
        this.setHeights({contentHeight: this.mContentHeight, viewportHeight: value});
    }

    updateSliderSize() {
        const slider = $(this.slider.current);
        const scrollbar = $(this.scrollbar.current);
        slider.css("height", this.viewportHeight / (this.contentHeight) * scrollbar.outerHeight(true));
    }

    onMouseMove(e) {
        const slider = $(this.slider.current);
        const scrollbar = $(this.scrollbar.current);
        slider.css({
            "top": clamp(
                this.sliderPositionOnMouseDown.y + e.clientY - this.mouseDownPosition.y,
                0,
                scrollbar.outerHeight(true) - slider.outerHeight(true)
            )
        });
        this.fireScrollEvent();
    }

    onMouseDown(e) {
        this.mouseDownPosition = {x: e.clientX, y: e.clientY};
        const slider = $(this.slider.current);
        this.sliderPositionOnMouseDown = {
            x: parseInt(slider.css("left"), 10),
            y: parseInt(slider.css("top"), 10)
        };
        document.addEventListener('mousemove', this.onMouseMove);

        const scrollbar = $(this.scrollbar.current);
        slider.addClass("hovering");
        scrollbar.addClass("hovering");
        slider.addClass("dragging");
        scrollbar.addClass("dragging");
    }

    onMouseUp() {
        document.removeEventListener('mousemove', this.onMouseMove);

        const slider = $(this.slider.current);
        const scrollbar = $(this.scrollbar.current);
        slider.removeClass("hovering");
        scrollbar.removeClass("hovering");
        slider.removeClass("dragging");
        scrollbar.removeClass("dragging");
    }

    onWheel(delta: number) {
        const slider = $(this.slider.current);
        const scrollbar = $(this.scrollbar.current);
        const sliderPosition = parseInt(slider.css("top"), 10);
        const clamp = (number, min, max) => Math.max(min, Math.min(number, max));
        slider.css({
            "top": clamp(
                sliderPosition + delta * (scrollbar.outerHeight(true) - slider.outerHeight(true)) / (this.contentHeight - this.viewportHeight),
                0,
                scrollbar.outerHeight(true) - slider.outerHeight(true)
            )
        });
        this.fireScrollEvent();
    }

    fireScrollEvent() {
        const {onScroll} = this.props;
        const slider = $(this.slider.current);
        const scrollbar = $(this.scrollbar.current);
        const sliderPosition = parseInt(slider.css("top"), 10);
        onScroll?.(sliderPosition / (scrollbar.outerHeight(true) - slider.outerHeight(true)) * (this.contentHeight - this.viewportHeight));
    }

    render() {
        return <div ref={this.scrollbar} className="scrollbar right vertical overlay-indicator">
            <div className="contents">
                <div className="trough">
                    <div ref={this.slider} className="slider" onMouseDown={this.onMouseDown}/>
                </div>
            </div>
        </div>;
    }
}
