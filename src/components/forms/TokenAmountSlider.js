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

        this.state = {
            proposedNewValue: 0
        };
    }

    isValidProposedValue = (v) => {
        // determine the range of sane values
        v = parseFloat(v);
        if(!v) { return false; }
        if(this.props.min && v < this.props.min) { return false; }
        if(this.props.max && v > this.props.max) { return false; }
        return true;
    }

    proposedValueChanged = (e) => {
        // the user's manual text value changed. if it's a sane
        // value, force the slider to update to it.
        let v = e.target.value;

        this.setState({
            proposedNewValue: v
        });

        if(this.isValidProposedValue(v)) {
            // Update the parent value... is this the right way?
            this.props.onChange(parseFloat(v));
        }
    }

    handleSliderChanged = (v) => {
        // the slider changed, update our proposed value first,
        // overriding whatever the user has typed, valid or not...
        this.setState({
            proposedNewValue: v
        });

        // Pass it along to the consumer's change method.
        this.props.onChange(v);
    }

    vitTooltipFormatter = (v) => {
        v = v || 0;
        return numberWithCommas(v.toFixed(3)) + ' ' + LIQUID_TOKEN;
    }

    render() {
        let { sliderLabel, tipFormatter, onChange, userCanType, ...restProps } = this.props;

        let sliderLabelControl =
            <label htmlFor={this.props.id} className="form-label">
                {this.props.label}: {this.props.isRequired ? '*' : null }
            </label>;

        let sliderControl =
            <TooltipSlider
                id={this.props.id}
                tipFormatter={ this.vitTooltipFormatter }
                onChange={ this.handleSliderChanged }
                {...restProps}
                />;

        let valueIndicator;

        if(userCanType) {
            // use the "typeable" value indicator
            valueIndicator =
                <span className="vit-typeable-value-indicator">
                    <input
                        className="form-control form-control-sm"
                        style={{ display: 'inline' }}
                        value={ this.state.proposedNewValue }
                        onChange={ this.proposedValueChanged }
                    />
                    &nbsp;{ LIQUID_TOKEN }
                </span>;
        } else {
            // use the normal fixed value indicator
            valueIndicator =
                <p className="vit-value-indicator">
                    { this.vitTooltipFormatter(this.props.value) }
                </p>;
        }

        if(userCanType) {
            // Typeable value indicator on right
            return (
                <span className="token-amount-slider">
                    { sliderLabelControl }

                    <div className="row align-items-center">
                        <div className="col-8">
                            { sliderControl }
                        </div>
                        <div className="col-4">
                            { valueIndicator }
                        </div>
                    </div>
                </span>
            );
        } else {
            // Regular read-only value indicator on the bottom
            return (
                <span className="token-amount-slider">
                    { sliderLabelControl }
                    { sliderControl }
                    { valueIndicator }
                </span>
            );
        }
    }
}

function mapStateToProps(state) {
    return {
    };
}

export default connect(mapStateToProps)(TokenAmountSlider);
