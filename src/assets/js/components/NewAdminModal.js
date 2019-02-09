import PropTypes from 'prop-types';
import React from 'react';
import {Button, Modal, ModalHeader, ModalBody, ModalFooter} from 'reactstrap';
import {connect} from 'react-redux';
import {Field, reduxForm} from 'redux-form';

import {Roles} from '~/static/Roles';

const initialValues = {
  username: '',
  password: '',
  role: Roles.ROLE_MEMBER
};

class NewAdminModal extends React.Component {
  static propTypes = {
    open: PropTypes.bool.isRequired,
    toggle: PropTypes.func.isRequired,
    handleSubmit: PropTypes.func.isRequired,

    pristine: PropTypes.bool.isRequired,
    submitting: PropTypes.bool.isRequired,

    lockRole: PropTypes.string
  };

  constructor(props) {
    super(props);

    this.state = {
      modal: (props.open ? props.open : false),
    };
  }

  render() {
    let {open, toggle, pristine, submitting, handleSubmit, lockRole} =
      this.props;

    return (
      <div>
        <Modal isOpen={open} toggle={toggle} size="lg">
          <form onSubmit={handleSubmit}>
            <ModalHeader toggle={toggle}>
              New {lockRole ? lockRole : 'Admin'}
            </ModalHeader>
            <ModalBody>
              <div className="container sd-form">
                <div className="row">
                  <div className="col-12">
                    <label className="sd-form__label">Username</label>
                    <Field name="username" className="sd-form__input-text"
                      type="text" placeholder="Username" component="input" />
                  </div>
                </div>

                <div className="row mt-2">
                  <div className="col-12">
                    <label className="sd-form__label">Password</label>
                    <Field name="password" className="sd-form__input-text"
                      type="text" placeholder="Password" component="input" />
                  </div>
                </div>

                <div className="row mt-2">
                  <div className="col-12">
                    <label className="sd-form__label">Role</label>
                    <div className="row">
                      {Object.values(Roles).map((role) =>
                        (<div className="col" key={role}>
                          <div className="sd-form__institution-card">
                            <Field name="role" component="input" type="radio"
                              value={role}
                              className={`sd-form__input-radio
                                sd-form__institution-radio`}
                              disabled={lockRole} />
                            <label className="sd-form__institution-label">
                              {role}
                            </label>
                          </div>
                        </div>)
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button type="submit" color="primary"
                disabled={pristine || submitting}>
                Register
              </Button>{' '}
              <Button color="secondary" outline onClick={toggle}>Cancel</Button>
            </ModalFooter>
          </form>
        </Modal>
      </div>
    );
  }
}

function mapStateToProps(_, ownProps) {
  return {
    form: ownProps.formName ? ownProps.formName : 'newAdminModal',
    initialValues: {
      role: ownProps.lockRole ? ownProps.lockRole : Roles.ROLE_MEMBER
    }
  };
};

NewAdminModal = reduxForm({
  form: 'newAdminModal',
  destroyOnUnmount: true,
  initialValues
})(NewAdminModal);

export default connect(mapStateToProps)(NewAdminModal);
