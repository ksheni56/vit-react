import React from 'react';
import { connect } from 'react-redux';
import Slider, { createSliderWithTooltip } from 'rc-slider';
import 'rc-slider/assets/index.css';
import { LIQUID_TOKEN } from '../../config';
import { numberWithCommas } from '../../utils/Format';

const TooltipSlider = createSliderWithTooltip(Slider);

class TokenAmountSlider extends TooltipSlider {
    constructor(props) {
        super(props);
    }

    vitTooltipFormatter = (v) => {
        v = v || 0;
        return numberWithCommas(v.toFixed(3)) + ' ' + LIQUID_TOKEN;
    }

    render() {
        let { sliderLabel, tipFormatter, ...restProps } = this.props;

        return(
            <span className="token-amount-slider">
                <label htmlFor={this.props.id} className="form-label">
                    {this.props.label}: {this.props.isRequired ? '*' : null }
                </label>

                <TooltipSlider
                    id={this.props.id}
                    tipFormatter={ this.vitTooltipFormatter }
                    onChange={this.onTokenValueChanged}
                    {...restProps}
                    />

                <p className="vit-value-indicator">
                    { this.vitTooltipFormatter(this.props.value) }
                </p>
            </span>
        )
    }
}

function mapStateToProps(state) {
    return {
    };
}

export default connect(mapStateToProps)(TokenAmountSlider);
