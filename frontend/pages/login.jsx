import { useState, useContext } from 'react'
import { useRouter } from 'next/router'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import userContext from '../utility/appContext'
import localForage from 'localforage'

// Styles, UI, UX
import Box from '@mui/material/Box'
import BusinessProfileLayout from '../layout/businessProfileLayout'
import Button from '@mui/material/Button'
import InputAdornment from '@mui/material/InputAdornment'
import Spinner from '../components/spinner'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import TextField from '@mui/material/TextField'
import Toast from '../components/toast'
import Typography from '@mui/material/Typography'

// Icons
import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import LockRoundedIcon from '@mui/icons-material/LockRounded'


// Define schema for form validation
const validationSchema = yup.object().shape({
    email: yup.string()
        .required("Email is required")
        .email("A valid email is required"),
    password: yup.string()
        .required("Password is required")
        .min(8, "Password must be at least 8 characters long")
        .max(50, "Password must be less than 50 characters long")
        .matches(/^(?=.*\d)(?=.*[A-Z])(?=.*[a-z])(?=.*[^\w\d\s:])([^\s])+$/gm, 'Password must be at least 8 characters, contain at least one number, one uppercase letter, one lowercase letter, and one special character'),
})


export default function Login() {
    // Set up router for redirects
    const router = useRouter()
    // Access user context
    const userData = useContext(userContext)

    // State Management
    const { control, handleSubmit, formState: { errors } } = useForm({ mode: "onChange",  resolver: yupResolver(validationSchema) })
    const [isLoading, setIsLoading] = useState(false)
    const [responseMessage, setResponseMessage] = useState(null)
    const [userType, setUserType] = useState("user")
    const [form, setForm] = useState({
        email: "",
        password: ""
    })

    const updateForm = ((value) =>  {
        setForm(prev => ({...prev, ...value}))
    })

    const handleLogin = async () => {
        // No need to prevent default as that is handled by react-hook-form
        try {
            // Start spinner
            setIsLoading(true)

            // Send login request to server
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login/${userType}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(form)
            })
            const data = await response.json()
            
            
            // Throw error if request failed
            if(data.status !== "success"){
                throw {
                    status: data.status,
                    message: data.message
                }
            }
            
            // Login was successful, set user data and tokens to local/session storage
            try {
                // Set tokens and user data to browser storage
                await localForage.setItem("accessToken", data.accessToken)
                await localForage.setItem("refreshToken", data.refreshToken)

                // Get businessId from backend if user is a businessRep
                if(userType === "businessRep"){
                    const userId = data.user._id

                    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/business-reps/business/${userId}`, {
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${await localForage.getItem('accessToken')}`
                        }
                    })
                    const businessData = await response.json()

                    // Throw error if request failed
                    if(response.status !== 200){
                        throw {
                            status: businessData.status,
                            message: businessData.message
                        }
                    }

                    // Attach business data to user object - this is not ideal but it will save time for now
                    const business = businessData.business
                    data.user.business = business
                }
                
                // Set user data to user context
                userData.login(data.user, userType)
                
                // Stop spinner
                setIsLoading(false)

                // Inform the user
                setResponseMessage({
                    status: data.status,
                    message: data.message,
                    severity: "success"
                })

                // Redirect to dashboard
                router.push("/home")

            } catch(err) {
                console.log("Error setting tokens to indexedDb: ", err)

                // Stop spinner
                setIsLoading(false)
                
                // Inform the user
                setResponseMessage({
                    status: "error", 
                    message: `Error setting data to storage: ${err}`, 
                    severity: "error"
                })  
            }

        } catch(err){
            // Log the error to console then show user the error message
            console.log(err)
           
            // Stop spinner
            setIsLoading(false)

            setResponseMessage({
                status: err.status, 
                message: err.message, 
                severity: "error"
            })  
        }
    }

    return (
        <>
            <BusinessProfileLayout logo="thumb" title=" ">
                <Box sx={styles.innerBox}>
                    <Typography sx={styles.title} variant="h3" align="center">
                        Login
                    </Typography>
                    <Box as="form" sx={styles.form} onSubmit={handleSubmit(handleLogin)}>
                        <Tabs 
                            sx={styles.userToggle}
                            variant="fullWidth"
                            value={userType} 
                            onChange={(e, newValue) => { setUserType(newValue) }}
                        >
                            <Tab label="User" value="user" />
                            <Tab label="Business" value="businessRep" />
                        </Tabs>
                        <Controller
                            name="email"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    sx={styles.formItem}
                                    name="email"
                                    InputProps={{ startAdornment: <InputAdornment sx={styles.inputIcons} position="start" ><AccountCircleIcon /></InputAdornment> }}
                                    type="text"
                                    placeholder="Email"
                                    { ...field }
                                    value={form.email}
                                    onChange={(e) => {updateForm({email: e.target.value}); field.onChange(e.target.value)}}
                                    error={!!errors.email}
                                    helperText={errors.email && errors?.email?.message}
                                />
                            )}
                        />
                        <Controller
                            name="password"
                            control={control}
                            render={({ field }) => (
                                <TextField 
                                    sx={styles.formItem}
                                    name="password"
                                    InputProps={{ startAdornment: <InputAdornment sx={styles.inputIcons} position="start" ><LockRoundedIcon /></InputAdornment> }}
                                    type="password"
                                    placeholder="Password"
                                    { ...field }
                                    value={form.password}
                                    onChange={(e) => {updateForm({password: e.target.value}); field.onChange(e.target.value)}}
                                    error={!!errors.password}
                                    helperText={errors.password && errors?.password?.message}
                                />
                            )}
                        />
                        <Button sx={styles.formItem} type="submit" variant="contained">Login</Button>
                    </Box>
                    <Toast response={responseMessage} setResponse={setResponseMessage} hideIn={6000} />
                    <Spinner open={isLoading} dialogStyle={styles.spinDialog} spinStyle={styles.spinStyle} />
                </Box>
            </BusinessProfileLayout>
        </>
    )
}


const styles = {
    innerBox: {
        width: "90%",
        maxWidth: 500,
    },
    title: {
        color: "custom.contrastText",
    },
    form: {
        mt: 3,
        display: "flex",
        flexDirection: "column",
    },
    userToggle: {
        width: "100%",
    },
    formItem: {
        mt: 1,
    },
    inputIcons: {
        color: "custom.contrastText",
    }
}