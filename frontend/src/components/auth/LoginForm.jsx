// src/components/auth/LoginForm.jsx
import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const LoginForm = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    try {
      // Handle login logic here
      console.log(data);
      // After successful login, redirect based on role
      if (data.role === 'client') {
        navigate('/client/dashboard');
      } else {
        navigate('/institution/dashboard');
      }
    } catch (error) {
      toast.error('Login failed. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700">Login</label>
        <input
          type="text"
          {...register('email', { required: 'Email is required' })}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Password</label>
        <input
          type="password"
          {...register('password', { required: 'Password is required' })}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        {errors.password && (
          <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
        )}
      </div>

      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">Role</label>
        <div className="flex space-x-4">
          <label className="flex items-center">
            <input
              type="radio"
              value="client"
              {...register('role', { required: 'Please select a role' })}
              className="h-4 w-4 text-blue-600"
            />
            <span className="ml-2">Client</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="institution"
              {...register('role', { required: 'Please select a role' })}
              className="h-4 w-4 text-blue-600"
            />
            <span className="ml-2">Financial Institution</span>
          </label>
        </div>
        {errors.role && (
          <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
        )}
      </div>

      <button
        type="submit"
        className="w-full rounded-md bg-blue-500 py-2 px-4 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Login
      </button>
    </form>
  );
};

export default LoginForm;