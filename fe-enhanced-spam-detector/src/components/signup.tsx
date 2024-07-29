import './signup.css'

const SignUp = () => {
    return (
        <section className="login-block">
                <div className="container-fluid">
                    <div className="row">
                        <div className="col-sm-12">
                            <form className="md-float-material form-material" action="#" method="POST">
                                <div className="auth-box card">
                                    <div className="card-block">
                                        <div className="row">
                                            <div className="col-md-12">
                                                <h3 className="text-center heading" >Sign Up directly using google account or create your own.</h3>
                                            </div>
                                        </div>
                                        <div className="form-group form-primary">
                                        
                                            <input type="text" className="form-control" name="first_name" value="" placeholder="Full Name" id="first_name" /> 
                                        </div>

                                        <div className="form-group form-primary">
                                            <input type="text" className="form-control" name="email" value="" placeholder="Email" id="email" />
                                        
                                        </div>

                                        <div className="form-group form-primary">
                                        <input type="password" className="form-control" name="password" placeholder="Password" value="" id="password" />
                                        
                                        </div>

                                        <div className="form-group form-primary">
                                            <input type="password" className="form-control" name="password_confirm" placeholder="Repeat password" value="" id="password_confirm" />
                                            
                                        </div>


                                        <div className="row">
                                            <div className="col-md-12">
                                                <input type="submit" className="btn btn-primary btn-md btn-block waves-effect text-center m-b-20" name="submit" value="Signup Now" />
                                            </div>
                                        </div>

                                        <div className="or-container"><div className="line-separator"></div> <div className="or-label">or</div><div className="line-separator"></div></div>

                                        <div className="row">
                                            <div className="col-md-12">
                                            <a className="btn btn-lg btn-google btn-block text-uppercase btn-outline" href="#"><img src="https://img.icons8.com/color/16/000000/google-logo.png" /> Signup Using Google</a>

                                            </div>
                                        </div>
                                        <br />

                                        <p className="text-inverse text-center">Already have an account? <a href="<?= base_url() ?>auth/login" data-abc="true">Login</a></p>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </section>
    )
}

export default SignUp